package service

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// =====================
// 错误定义
// =====================

var (
	ErrEarningNotFound         = errors.New("earning not found")
	ErrAccountNotFound         = errors.New("creator account not found")
	ErrInsufficientBalance     = errors.New("insufficient balance")
	ErrWithdrawalNotFound      = errors.New("withdrawal not found")
	ErrInvalidWithdrawalStatus = errors.New("invalid withdrawal status")
	ErrMinWithdrawalAmount     = errors.New("withdrawal amount below minimum")
	ErrPaymentNotVerified      = errors.New("payment method not verified")
	ErrInvalidCommissionRate   = errors.New("invalid commission rate")
)

// =====================
// 常量定义
// =====================

const (
	// 默认分成比例 (70%)
	DefaultCommissionRate = 0.70
	// 最小提现金额
	MinWithdrawalAmount = 100.00
	// 提现手续费比例
	WithdrawalFeeRate = 0.01
	// 最小提现手续费
	MinWithdrawalFee = 1.00
)

// =====================
// 服务接口
// =====================

// EarningService 收入服务接口
type EarningService interface {
	// 收入操作
	CreateEarning(ctx context.Context, req CreateEarningRequest) (*entity.Earning, error)
	GetEarning(ctx context.Context, id uuid.UUID) (*entity.Earning, error)
	ListEarnings(ctx context.Context, userID uuid.UUID, params repository.EarningListParams) ([]entity.Earning, int64, error)
	ConfirmEarning(ctx context.Context, id uuid.UUID) error
	RefundEarning(ctx context.Context, id uuid.UUID, reason string) error

	// 分成计算
	CalculateCommission(ctx context.Context, userID uuid.UUID, grossAmount float64, earningType entity.EarningType) (*CommissionResult, error)
	GetCommissionTiers(ctx context.Context) ([]entity.CommissionTier, error)

	// 账户操作
	GetCreatorAccount(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error)
	GetOrCreateAccount(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error)
	UpdatePaymentInfo(ctx context.Context, userID uuid.UUID, req UpdatePaymentRequest) error

	// 提现操作
	RequestWithdrawal(ctx context.Context, userID uuid.UUID, amount float64, note string) (*entity.Withdrawal, error)
	ListWithdrawals(ctx context.Context, userID uuid.UUID, params repository.WithdrawalListParams) ([]entity.Withdrawal, int64, error)
	ProcessWithdrawal(ctx context.Context, id uuid.UUID, adminID uuid.UUID, approved bool, reason string) error

	// 仪表盘
	GetCreatorDashboard(ctx context.Context, userID uuid.UUID) (*entity.CreatorDashboard, error)

	// 结算
	RunSettlement(ctx context.Context, adminID uuid.UUID) (*entity.Settlement, error)
}

// =====================
// 请求结构
// =====================

// CreateEarningRequest 创建收入请求
type CreateEarningRequest struct {
	UserID      uuid.UUID
	AgentID     *uuid.UUID
	BuyerID     *uuid.UUID
	EarningType entity.EarningType
	GrossAmount float64
	OrderID     *string
	Description *string
	ReferrerID  *uuid.UUID
}

// UpdatePaymentRequest 更新收款信息请求
type UpdatePaymentRequest struct {
	PaymentMethod  string
	PaymentAccount string
	PaymentName    string
}

// CommissionResult 分成计算结果
type CommissionResult struct {
	GrossAmount    float64 `json:"gross_amount"`
	CommissionRate float64 `json:"commission_rate"`
	NetAmount      float64 `json:"net_amount"`
	PlatformFee    float64 `json:"platform_fee"`
	TierName       string  `json:"tier_name"`
	TierID         *uuid.UUID `json:"tier_id"`
}

// =====================
// 服务实现
// =====================

type earningService struct {
	earningRepo    repository.EarningRepository
	accountRepo    repository.CreatorAccountRepository
	tierRepo       repository.CommissionTierRepository
	withdrawalRepo repository.WithdrawalRepository
	settlementRepo repository.SettlementRepository
}

// NewEarningService 创建收入服务实例
func NewEarningService(
	earningRepo repository.EarningRepository,
	accountRepo repository.CreatorAccountRepository,
	tierRepo repository.CommissionTierRepository,
	withdrawalRepo repository.WithdrawalRepository,
	settlementRepo repository.SettlementRepository,
) EarningService {
	return &earningService{
		earningRepo:    earningRepo,
		accountRepo:    accountRepo,
		tierRepo:       tierRepo,
		withdrawalRepo: withdrawalRepo,
		settlementRepo: settlementRepo,
	}
}

// =====================
// 收入操作
// =====================

func (s *earningService) CreateEarning(ctx context.Context, req CreateEarningRequest) (*entity.Earning, error) {
	// 计算分成
	commission, err := s.CalculateCommission(ctx, req.UserID, req.GrossAmount, req.EarningType)
	if err != nil {
		return nil, err
	}

	// 创建收入记录
	earning := &entity.Earning{
		UserID:         req.UserID,
		AgentID:        req.AgentID,
		BuyerID:        req.BuyerID,
		EarningType:    req.EarningType,
		GrossAmount:    commission.GrossAmount,
		PlatformFee:    commission.PlatformFee,
		NetAmount:      commission.NetAmount,
		CommissionRate: commission.CommissionRate,
		OrderID:        req.OrderID,
		Description:    req.Description,
		Status:         entity.EarningStatusPending,
	}

	// 处理推荐奖励
	if req.ReferrerID != nil && req.EarningType == entity.EarningTypeSale {
		earning.ReferrerID = req.ReferrerID
		// 推荐奖励为交易金额的 5%
		bonus := math.Round(req.GrossAmount*0.05*100) / 100
		earning.ReferralBonus = &bonus

		// 为推荐人创建推荐收入
		go s.createReferralEarning(context.Background(), *req.ReferrerID, req.UserID, bonus, req.AgentID)
	}

	if err := s.earningRepo.Create(ctx, earning); err != nil {
		return nil, err
	}

	// 更新创作者账户待结算余额
	if _, err := s.accountRepo.GetOrCreate(ctx, req.UserID); err != nil {
		return nil, err
	}
	if err := s.accountRepo.AddPendingBalance(ctx, req.UserID, commission.NetAmount); err != nil {
		return nil, err
	}
	if err := s.accountRepo.AddMonthlyRevenue(ctx, req.UserID, commission.GrossAmount); err != nil {
		return nil, err
	}
	if err := s.accountRepo.IncrementCount(ctx, req.UserID, req.EarningType); err != nil {
		return nil, err
	}

	return earning, nil
}

// createReferralEarning 创建推荐收入
func (s *earningService) createReferralEarning(ctx context.Context, referrerID, referredID uuid.UUID, amount float64, agentID *uuid.UUID) {
	description := "推荐奖励"
	earning := &entity.Earning{
		UserID:         referrerID,
		AgentID:        agentID,
		BuyerID:        &referredID,
		EarningType:    entity.EarningTypeReferral,
		GrossAmount:    amount,
		PlatformFee:    0,
		NetAmount:      amount,
		CommissionRate: 1.0, // 推荐奖励全额给推荐人
		Description:    &description,
		Status:         entity.EarningStatusPending,
	}

	_ = s.earningRepo.Create(ctx, earning)
	_ = s.accountRepo.AddPendingBalance(ctx, referrerID, amount)
	_ = s.accountRepo.IncrementCount(ctx, referrerID, entity.EarningTypeReferral)
}

func (s *earningService) GetEarning(ctx context.Context, id uuid.UUID) (*entity.Earning, error) {
	return s.earningRepo.GetByID(ctx, id)
}

func (s *earningService) ListEarnings(ctx context.Context, userID uuid.UUID, params repository.EarningListParams) ([]entity.Earning, int64, error) {
	params.UserID = &userID
	return s.earningRepo.List(ctx, params)
}

func (s *earningService) ConfirmEarning(ctx context.Context, id uuid.UUID) error {
	earning, err := s.earningRepo.GetByID(ctx, id)
	if err != nil {
		return ErrEarningNotFound
	}

	if earning.Status != entity.EarningStatusPending {
		return errors.New("earning is not pending")
	}

	// 更新状态
	if err := s.earningRepo.UpdateStatus(ctx, id, entity.EarningStatusConfirmed); err != nil {
		return err
	}

	// 将待结算余额转为可提现余额
	return s.accountRepo.ConfirmBalance(ctx, earning.UserID, earning.NetAmount)
}

func (s *earningService) RefundEarning(ctx context.Context, id uuid.UUID, reason string) error {
	earning, err := s.earningRepo.GetByID(ctx, id)
	if err != nil {
		return ErrEarningNotFound
	}

	if earning.Status == entity.EarningStatusRefunded || earning.Status == entity.EarningStatusCancelled {
		return errors.New("earning already refunded or cancelled")
	}

	now := time.Now()
	earning.Status = entity.EarningStatusRefunded
	earning.RefundReason = &reason
	earning.RefundedAt = &now

	if err := s.earningRepo.Update(ctx, earning); err != nil {
		return err
	}

	// 从账户中扣除
	// 如果是待确认状态，从待结算余额扣除
	// 如果是已确认状态，从可提现余额扣除
	if earning.Status == entity.EarningStatusPending {
		return s.accountRepo.AddPendingBalance(ctx, earning.UserID, -earning.NetAmount)
	}
	return s.accountRepo.DeductBalance(ctx, earning.UserID, earning.NetAmount)
}

// =====================
// 分成计算
// =====================

func (s *earningService) CalculateCommission(ctx context.Context, userID uuid.UUID, grossAmount float64, earningType entity.EarningType) (*CommissionResult, error) {
	if grossAmount <= 0 {
		return nil, ErrInvalidCommissionRate
	}

	// 获取创作者账户
	account, err := s.accountRepo.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 根据月收入获取对应的分成等级
	tier, err := s.tierRepo.GetByRevenue(ctx, account.MonthlyRevenue, &earningType)
	if err != nil {
		// 如果没有找到特定类型的规则，尝试获取通用规则
		tier, err = s.tierRepo.GetByRevenue(ctx, account.MonthlyRevenue, nil)
	}

	var rate float64
	var tierName string
	var tierID *uuid.UUID

	if err == nil && tier != nil {
		rate = tier.CommissionRate
		tierName = tier.TierName
		tierID = &tier.ID
	} else {
		// 使用默认分成比例
		rate = DefaultCommissionRate
		tierName = "默认等级"
	}

	// 计算净收入和平台费用
	netAmount := math.Round(grossAmount*rate*100) / 100
	platformFee := math.Round((grossAmount-netAmount)*100) / 100

	return &CommissionResult{
		GrossAmount:    grossAmount,
		CommissionRate: rate,
		NetAmount:      netAmount,
		PlatformFee:    platformFee,
		TierName:       tierName,
		TierID:         tierID,
	}, nil
}

func (s *earningService) GetCommissionTiers(ctx context.Context) ([]entity.CommissionTier, error) {
	return s.tierRepo.GetActive(ctx)
}

// =====================
// 账户操作
// =====================

func (s *earningService) GetCreatorAccount(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error) {
	account, err := s.accountRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	// 检查是否需要重置月度收入
	now := time.Now()
	if account.MonthlyResetAt.Month() != now.Month() || account.MonthlyResetAt.Year() != now.Year() {
		account.MonthlyRevenue = 0
		account.MonthlyResetAt = now
		_ = s.accountRepo.Update(ctx, account)
	}

	// 获取当前分成等级
	if tier, err := s.tierRepo.GetByRevenue(ctx, account.MonthlyRevenue, nil); err == nil {
		account.CurrentTier = tier
		account.CurrentTierID = &tier.ID
	}

	return account, nil
}

func (s *earningService) GetOrCreateAccount(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error) {
	return s.accountRepo.GetOrCreate(ctx, userID)
}

func (s *earningService) UpdatePaymentInfo(ctx context.Context, userID uuid.UUID, req UpdatePaymentRequest) error {
	account, err := s.accountRepo.GetByUserID(ctx, userID)
	if err != nil {
		return ErrAccountNotFound
	}

	account.PaymentMethod = &req.PaymentMethod
	account.PaymentAccount = &req.PaymentAccount
	account.PaymentName = &req.PaymentName
	// 更新收款信息后需要重新验证
	account.IsVerified = false

	return s.accountRepo.Update(ctx, account)
}

// =====================
// 提现操作
// =====================

func (s *earningService) RequestWithdrawal(ctx context.Context, userID uuid.UUID, amount float64, note string) (*entity.Withdrawal, error) {
	// 检查最小提现金额
	if amount < MinWithdrawalAmount {
		return nil, ErrMinWithdrawalAmount
	}

	// 获取账户
	account, err := s.accountRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	// 检查余额
	if account.Balance < amount {
		return nil, ErrInsufficientBalance
	}

	// 检查收款信息
	if account.PaymentMethod == nil || account.PaymentAccount == nil {
		return nil, ErrPaymentNotVerified
	}

	// 计算手续费
	fee := math.Max(amount*WithdrawalFeeRate, MinWithdrawalFee)
	fee = math.Round(fee*100) / 100
	actualAmount := amount - fee

	// 创建提现申请
	withdrawal := &entity.Withdrawal{
		UserID:         userID,
		AccountID:      account.ID,
		Amount:         amount,
		Fee:            fee,
		ActualAmount:   actualAmount,
		PaymentMethod:  *account.PaymentMethod,
		PaymentAccount: *account.PaymentAccount,
		PaymentName:    *account.PaymentName,
		Status:         entity.WithdrawalStatusPending,
		Note:           &note,
	}

	if err := s.withdrawalRepo.Create(ctx, withdrawal); err != nil {
		return nil, err
	}

	// 冻结余额 (从可提现余额转为待处理)
	// 注意：这里不直接扣除，等审核通过后再扣除
	return withdrawal, nil
}

func (s *earningService) ListWithdrawals(ctx context.Context, userID uuid.UUID, params repository.WithdrawalListParams) ([]entity.Withdrawal, int64, error) {
	params.UserID = &userID
	return s.withdrawalRepo.List(ctx, params)
}

func (s *earningService) ProcessWithdrawal(ctx context.Context, id uuid.UUID, adminID uuid.UUID, approved bool, reason string) error {
	withdrawal, err := s.withdrawalRepo.GetByID(ctx, id)
	if err != nil {
		return ErrWithdrawalNotFound
	}

	if withdrawal.Status != entity.WithdrawalStatusPending {
		return ErrInvalidWithdrawalStatus
	}

	if approved {
		// 审核通过
		withdrawal.Status = entity.WithdrawalStatusProcessing
		withdrawal.ProcessedBy = &adminID
		now := time.Now()
		withdrawal.ProcessedAt = &now

		if err := s.withdrawalRepo.Update(ctx, withdrawal); err != nil {
			return err
		}

		// 从账户扣除余额
		return s.accountRepo.DeductBalance(ctx, withdrawal.UserID, withdrawal.Amount)
	} else {
		// 审核拒绝
		withdrawal.Status = entity.WithdrawalStatusRejected
		withdrawal.ProcessedBy = &adminID
		now := time.Now()
		withdrawal.ProcessedAt = &now
		withdrawal.RejectionReason = &reason

		return s.withdrawalRepo.Update(ctx, withdrawal)
	}
}

// =====================
// 仪表盘
// =====================

func (s *earningService) GetCreatorDashboard(ctx context.Context, userID uuid.UUID) (*entity.CreatorDashboard, error) {
	// 获取账户
	account, err := s.GetCreatorAccount(ctx, userID)
	if err != nil {
		// 如果账户不存在，创建新账户
		account, err = s.GetOrCreateAccount(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	dashboard := &entity.CreatorDashboard{
		Account: account,
	}

	// 获取当前分成等级
	if tier, err := s.tierRepo.GetByRevenue(ctx, account.MonthlyRevenue, nil); err == nil {
		dashboard.CurrentTier = tier
	}

	// 今日收入
	if stats, err := s.earningRepo.GetStats(ctx, userID, todayStart, now); err == nil {
		dashboard.TodayEarnings = stats.TotalNet
	}

	// 本周收入
	if stats, err := s.earningRepo.GetStats(ctx, userID, weekStart, now); err == nil {
		dashboard.WeekEarnings = stats.TotalNet
	}

	// 本月收入
	if stats, err := s.earningRepo.GetStats(ctx, userID, monthStart, now); err == nil {
		dashboard.MonthEarnings = stats.TotalNet
	}

	// 按类型统计
	if byType, err := s.earningRepo.GetByType(ctx, userID, monthStart, now); err == nil {
		dashboard.ByType = byType
	}

	// 月度趋势
	if monthly, err := s.earningRepo.GetMonthly(ctx, userID, 12); err == nil {
		dashboard.Monthly = monthly
	}

	// 最近收入
	if earnings, _, err := s.earningRepo.List(ctx, repository.EarningListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10,
	}); err == nil {
		dashboard.RecentEarnings = earnings
	}

	// Top Agents
	if topAgents, err := s.earningRepo.GetTopAgents(ctx, userID, 5); err == nil {
		dashboard.TopAgents = topAgents
	}

	return dashboard, nil
}

// =====================
// 结算
// =====================

func (s *earningService) RunSettlement(ctx context.Context, adminID uuid.UUID) (*entity.Settlement, error) {
	now := time.Now()
	// 结算周期：上月 1 日到上月最后一天
	periodEnd := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).AddDate(0, 0, -1)
	periodStart := time.Date(periodEnd.Year(), periodEnd.Month(), 1, 0, 0, 0, 0, now.Location())

	// 获取待结算的收入
	earnings, err := s.earningRepo.GetPendingForSettlement(ctx)
	if err != nil {
		return nil, err
	}

	if len(earnings) == 0 {
		return nil, errors.New("no earnings to settle")
	}

	// 计算统计
	var totalAmount, totalPlatformFee, totalCreatorShare float64
	var earningIDs []uuid.UUID

	for _, e := range earnings {
		if e.CreatedAt.After(periodEnd) {
			continue // 跳过本月的收入
		}
		totalAmount += e.GrossAmount
		totalPlatformFee += e.PlatformFee
		totalCreatorShare += e.NetAmount
		earningIDs = append(earningIDs, e.ID)
	}

	if len(earningIDs) == 0 {
		return nil, errors.New("no eligible earnings to settle")
	}

	// 创建结算批次
	settlement := &entity.Settlement{
		PeriodStart:       periodStart,
		PeriodEnd:         periodEnd,
		TotalEarnings:     len(earningIDs),
		TotalAmount:       math.Round(totalAmount*100) / 100,
		TotalPlatformFee:  math.Round(totalPlatformFee*100) / 100,
		TotalCreatorShare: math.Round(totalCreatorShare*100) / 100,
		Status:            "completed",
		ProcessedBy:       &adminID,
		ProcessedAt:       &now,
	}

	if err := s.settlementRepo.Create(ctx, settlement); err != nil {
		return nil, err
	}

	// 批量更新收入状态
	if err := s.earningRepo.BatchUpdateSettlement(ctx, earningIDs, settlement.ID); err != nil {
		return nil, err
	}

	return settlement, nil
}
