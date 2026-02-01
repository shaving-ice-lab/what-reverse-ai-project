package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrAgentNotFound       = errors.New("agent not found")
	ErrSlugExists          = errors.New("slug already exists")
	ErrAlreadyReported     = errors.New("already reported this agent")
	ErrReportNotFound      = errors.New("report not found")
	ErrInvalidReportReason = errors.New("invalid report reason")
	ErrNotAgentOwner       = errors.New("not agent owner")
	ErrAgentAlreadyPending = errors.New("agent already pending review")
)

// AgentService Agent 服务接口
type AgentService interface {
	Publish(ctx context.Context, userID uuid.UUID, req PublishAgentRequest) (*entity.Agent, error)
	GetBySlug(ctx context.Context, slug string) (*entity.Agent, error)
	List(ctx context.Context, params repository.AgentListParams) ([]entity.Agent, int64, error)
	Featured(ctx context.Context, limit int) ([]entity.Agent, error)
	Trending(ctx context.Context, params repository.TrendingParams) ([]entity.Agent, error)
	ListByTags(ctx context.Context, tags []string, page, pageSize int) ([]entity.Agent, int64, error)
	Update(ctx context.Context, id, userID uuid.UUID, req UpdateAgentRequest) (*entity.Agent, error)
	Use(ctx context.Context, agentID, userID uuid.UUID, inputs entity.JSON) error
	Fork(ctx context.Context, agentID, userID uuid.UUID) (*entity.Workflow, error)
	Star(ctx context.Context, agentID, userID uuid.UUID) error
	Unstar(ctx context.Context, agentID, userID uuid.UUID) error
	Report(ctx context.Context, agentID, userID uuid.UUID, req ReportAgentRequest) (*entity.AgentReport, error)
	Analytics(ctx context.Context, agentID, userID uuid.UUID, period string) (*AgentAnalytics, error)
	SubmitForReview(ctx context.Context, agentID, userID uuid.UUID) error
	Categories(ctx context.Context) []Category
}

// AgentAnalytics Agent 分析数据
type AgentAnalytics struct {
	// 概览数据
	TotalUses      int64   `json:"total_uses"`
	UniqueUsers    int64   `json:"unique_users"`
	TotalStars     int64   `json:"total_stars"`
	TotalForks     int64   `json:"total_forks"`
	TotalReviews   int64   `json:"total_reviews"`
	AverageRating  float64 `json:"average_rating"`

	// 使用趋势 (按日)
	DailyStats     []DailyStat `json:"daily_stats"`

	// Token 统计
	TotalTokens    int64 `json:"total_tokens"`
	InputTokens    int64 `json:"input_tokens"`
	OutputTokens   int64 `json:"output_tokens"`

	// 收入统计
	TotalRevenue   float64 `json:"total_revenue"`
	PaidUseCount   int64   `json:"paid_use_count"`

	// 用户来源
	SourceBreakdown map[string]int64 `json:"source_breakdown"`
}

// DailyStat 每日统计
type DailyStat struct {
	Date      string `json:"date"`
	UseCount  int64  `json:"use_count"`
	Users     int64  `json:"users"`
	Tokens    int64  `json:"tokens"`
	Revenue   float64 `json:"revenue"`
}

// ReportAgentRequest 举报 Agent 请求
type ReportAgentRequest struct {
	Reason      string   `json:"reason"`      // spam, inappropriate, copyright, misleading, other
	Description string   `json:"description"` // 详细描述
	Evidence    []string `json:"evidence"`    // 截图等证据 URL
}

// PublishAgentRequest 发布 Agent 请求
type PublishAgentRequest struct {
	WorkflowID      uuid.UUID
	Name            string
	Description     string
	LongDescription *string
	Icon            string
	CoverImage      *string
	Category        string
	Tags            []string
	PricingType     string
	Price           *float64
	Screenshots     []string
	DemoVideo       *string
}

// UpdateAgentRequest 更新 Agent 请求
type UpdateAgentRequest struct {
	Name            *string
	Description     *string
	LongDescription *string
	Icon            *string
	CoverImage      *string
	Category        *string
	Tags            []string
	PricingType     *string
	Price           *float64
	Screenshots     []string
	DemoVideo       *string
}

// Category 分类
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
}

type agentService struct {
	agentRepo    repository.AgentRepository
	workflowRepo repository.WorkflowRepository
	reportRepo   repository.AgentReportRepository
	usageRepo    repository.AgentUsageRepository
}

// NewAgentService 创建 Agent 服务实例
func NewAgentService(agentRepo repository.AgentRepository, workflowRepo repository.WorkflowRepository) AgentService {
	return &agentService{
		agentRepo:    agentRepo,
		workflowRepo: workflowRepo,
	}
}

// NewAgentServiceWithReport 创建带举报功能的 Agent 服务实例
func NewAgentServiceWithReport(agentRepo repository.AgentRepository, workflowRepo repository.WorkflowRepository, reportRepo repository.AgentReportRepository) AgentService {
	return &agentService{
		agentRepo:    agentRepo,
		workflowRepo: workflowRepo,
		reportRepo:   reportRepo,
	}
}

// NewAgentServiceFull 创建完整功能的 Agent 服务实例
func NewAgentServiceFull(agentRepo repository.AgentRepository, workflowRepo repository.WorkflowRepository, reportRepo repository.AgentReportRepository, usageRepo repository.AgentUsageRepository) AgentService {
	return &agentService{
		agentRepo:    agentRepo,
		workflowRepo: workflowRepo,
		reportRepo:   reportRepo,
		usageRepo:    usageRepo,
	}
}

func (s *agentService) Publish(ctx context.Context, userID uuid.UUID, req PublishAgentRequest) (*entity.Agent, error) {
	// 验证工作流
	workflow, err := s.workflowRepo.GetByID(ctx, req.WorkflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 生成 slug
	slug := generateSlug(req.Name)

	agent := &entity.Agent{
		UserID:          userID,
		WorkflowID:      req.WorkflowID,
		Name:            req.Name,
		Slug:            slug,
		Description:     &req.Description,
		LongDescription: req.LongDescription,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Category:        req.Category,
		Tags:            req.Tags,
		PricingType:     req.PricingType,
		Price:           req.Price,
		Screenshots:     req.Screenshots,
		DemoVideo:       req.DemoVideo,
		Status:          "pending_review", // 待审核
	}

	if err := s.agentRepo.Create(ctx, agent); err != nil {
		return nil, err
	}

	return agent, nil
}

func (s *agentService) GetBySlug(ctx context.Context, slug string) (*entity.Agent, error) {
	return s.agentRepo.GetBySlug(ctx, slug)
}

func (s *agentService) List(ctx context.Context, params repository.AgentListParams) ([]entity.Agent, int64, error) {
	return s.agentRepo.List(ctx, params)
}

func (s *agentService) Featured(ctx context.Context, limit int) ([]entity.Agent, error) {
	return s.agentRepo.Featured(ctx, limit)
}

func (s *agentService) Trending(ctx context.Context, params repository.TrendingParams) ([]entity.Agent, error) {
	return s.agentRepo.Trending(ctx, params)
}

func (s *agentService) ListByTags(ctx context.Context, tags []string, page, pageSize int) ([]entity.Agent, int64, error) {
	return s.agentRepo.ListByTags(ctx, tags, page, pageSize)
}

func (s *agentService) Update(ctx context.Context, id, userID uuid.UUID, req UpdateAgentRequest) (*entity.Agent, error) {
	agent, err := s.agentRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	if agent.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 更新字段
	if req.Name != nil {
		agent.Name = *req.Name
	}
	if req.Description != nil {
		agent.Description = req.Description
	}
	if req.LongDescription != nil {
		agent.LongDescription = req.LongDescription
	}
	if req.Icon != nil {
		agent.Icon = *req.Icon
	}
	if req.CoverImage != nil {
		agent.CoverImage = req.CoverImage
	}
	if req.Category != nil {
		agent.Category = *req.Category
	}
	if req.Tags != nil {
		agent.Tags = req.Tags
	}
	if req.PricingType != nil {
		agent.PricingType = *req.PricingType
	}
	if req.Price != nil {
		agent.Price = req.Price
	}
	if req.Screenshots != nil {
		agent.Screenshots = req.Screenshots
	}
	if req.DemoVideo != nil {
		agent.DemoVideo = req.DemoVideo
	}

	if err := s.agentRepo.Update(ctx, agent); err != nil {
		return nil, err
	}

	return agent, nil
}

func (s *agentService) Use(ctx context.Context, agentID, userID uuid.UUID, inputs entity.JSON) error {
	return s.agentRepo.IncrementUseCount(ctx, agentID)
}

func (s *agentService) Fork(ctx context.Context, agentID, userID uuid.UUID) (*entity.Workflow, error) {
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	// 复制工作流
	original, err := s.workflowRepo.GetByID(ctx, agent.WorkflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	copy := &entity.Workflow{
		UserID:        userID,
		Name:          agent.Name + " (Fork)",
		Description:   agent.Description,
		Icon:          agent.Icon,
		Definition:    original.Definition,
		Variables:     original.Variables,
		TriggerType:   original.TriggerType,
		TriggerConfig: original.TriggerConfig,
	}

	if err := s.workflowRepo.Create(ctx, copy); err != nil {
		return nil, err
	}

	return copy, nil
}

func (s *agentService) Star(ctx context.Context, agentID, userID uuid.UUID) error {
	// TODO: 记录用户收藏关系
	return s.agentRepo.IncrementStarCount(ctx, agentID)
}

func (s *agentService) Unstar(ctx context.Context, agentID, userID uuid.UUID) error {
	// TODO: 删除用户收藏关系
	return s.agentRepo.DecrementStarCount(ctx, agentID)
}

func (s *agentService) Report(ctx context.Context, agentID, userID uuid.UUID, req ReportAgentRequest) (*entity.AgentReport, error) {
	// 验证 Agent 存在
	_, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	// 验证举报原因
	validReasons := map[string]bool{
		entity.ReportReasonSpam:          true,
		entity.ReportReasonInappropriate: true,
		entity.ReportReasonCopyright:     true,
		entity.ReportReasonMisleading:    true,
		entity.ReportReasonOther:         true,
	}
	if !validReasons[req.Reason] {
		return nil, ErrInvalidReportReason
	}

	// 检查是否已举报
	if s.reportRepo != nil {
		existing, _ := s.reportRepo.GetByAgentAndUser(ctx, agentID, userID)
		if existing != nil {
			return nil, ErrAlreadyReported
		}

		// 创建举报记录
		report := &entity.AgentReport{
			AgentID:     agentID,
			UserID:      userID,
			Reason:      req.Reason,
			Description: req.Description,
			Evidence:    req.Evidence,
			Status:      "pending",
		}

		if err := s.reportRepo.Create(ctx, report); err != nil {
			return nil, err
		}

		return report, nil
	}

	return nil, errors.New("report repository not configured")
}

func (s *agentService) Categories(ctx context.Context) []Category {
	return []Category{
		{ID: "content", Name: "内容创作", Icon: "✍️", Description: "文章写作、社媒内容、文案生成"},
		{ID: "data", Name: "数据处理", Icon: "📊", Description: "数据清洗、报表生成、分析摘要"},
		{ID: "customer", Name: "客户服务", Icon: "💬", Description: "智能客服、FAQ 自动回复"},
		{ID: "productivity", Name: "办公效率", Icon: "💼", Description: "日程管理、邮件处理、会议纪要"},
		{ID: "developer", Name: "开发工具", Icon: "💻", Description: "代码审查、文档生成、Bug 分析"},
		{ID: "research", Name: "研究分析", Icon: "🔍", Description: "竞品分析、市场调研、论文阅读"},
		{ID: "education", Name: "教育学习", Icon: "📚", Description: "学习辅导、知识问答、课程规划"},
		{ID: "finance", Name: "金融财务", Icon: "💰", Description: "财务分析、投资建议、预算管理"},
		{ID: "marketing", Name: "市场营销", Icon: "📈", Description: "营销策划、广告文案、用户分析"},
		{ID: "other", Name: "其他", Icon: "🔮", Description: "其他类型的 Agent"},
	}
}

func (s *agentService) Analytics(ctx context.Context, agentID, userID uuid.UUID, period string) (*AgentAnalytics, error) {
	// 获取 Agent 并验证权限
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	if agent.UserID != userID {
		return nil, ErrNotAgentOwner
	}

	analytics := &AgentAnalytics{
		TotalUses:       int64(agent.UseCount),
		TotalStars:      int64(agent.StarCount),
		TotalForks:      0,
		TotalReviews:    int64(agent.ReviewCount),
		AverageRating:   agent.AvgRating,
		SourceBreakdown: make(map[string]int64),
	}

	// 获取使用统计
	if s.usageRepo != nil {
		// 计算时间范围
		now := timeNow()
		var startDate, endDate = now.AddDate(0, 0, -30), now

		switch period {
		case "7d":
			startDate = now.AddDate(0, 0, -7)
		case "30d":
			startDate = now.AddDate(0, 0, -30)
		case "90d":
			startDate = now.AddDate(0, 0, -90)
		case "1y":
			startDate = now.AddDate(-1, 0, 0)
		}

		// 获取汇总统计
		stats, err := s.usageRepo.GetStats(ctx, agentID, startDate, endDate)
		if err == nil && stats != nil {
			analytics.TotalUses = stats.TotalUses
			analytics.UniqueUsers = stats.UniqueUsers
			analytics.TotalTokens = stats.TotalTokens
			analytics.TotalRevenue = stats.TotalRevenue
		}

		// 获取每日统计
		dailyStats, err := s.usageRepo.GetDailyStats(ctx, agentID, startDate, endDate)
		if err == nil {
			var (
				inputTokens  int64
				outputTokens int64
				tokenSum     int64
				revenueSum   float64
			)
			for _, ds := range dailyStats {
				analytics.DailyStats = append(analytics.DailyStats, DailyStat{
					Date:     ds.StatDate.Format("2006-01-02"),
					UseCount: int64(ds.UseCount),
					Users:    int64(ds.UniqueUsers),
					Tokens:   int64(ds.TotalTokens),
					Revenue:  ds.TotalRevenue,
				})
				tokenSum += int64(ds.TotalTokens)
				inputTokens += int64(ds.TotalInputTokens)
				outputTokens += int64(ds.TotalOutputTokens)
				revenueSum += ds.TotalRevenue
				analytics.PaidUseCount += int64(ds.PaidUseCount)
			}

			// 如果汇总统计缺失，使用按日数据累加
			if analytics.TotalTokens == 0 {
				analytics.TotalTokens = tokenSum
			}
			analytics.InputTokens = inputTokens
			analytics.OutputTokens = outputTokens

			if analytics.TotalRevenue == 0 {
				analytics.TotalRevenue = revenueSum
			}
		}
	}

	return analytics, nil
}

func (s *agentService) SubmitForReview(ctx context.Context, agentID, userID uuid.UUID) error {
	// 获取 Agent 并验证权限
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		return ErrAgentNotFound
	}

	if agent.UserID != userID {
		return ErrNotAgentOwner
	}

	// 检查当前状态
	if agent.Status == "pending" {
		return ErrAgentAlreadyPending
	}

	// 更新状态为待审核
	agent.Status = "pending"
	return s.agentRepo.Update(ctx, agent)
}

// generateSlug 生成 URL-friendly slug
func generateSlug(name string) string {
	// 转小写
	slug := strings.ToLower(name)
	// 替换空格为连字符
	slug = strings.ReplaceAll(slug, " ", "-")
	// 移除特殊字符
	reg := regexp.MustCompile(`[^a-z0-9\-]`)
	slug = reg.ReplaceAllString(slug, "")
	// 移除多余连字符
	reg = regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")
	// 移除首尾连字符
	slug = strings.Trim(slug, "-")
	// 添加唯一后缀
	slug = slug + "-" + uuid.New().String()[:8]
	return slug
}

// timeNow 返回当前时间（便于测试时 mock）
var timeNow = func() time.Time {
	return time.Now()
}
