package search

import (
	"context"
	"time"
)

// SearchProvider 搜索提供商类型
type SearchProvider string

const (
	ProviderTavily SearchProvider = "tavily"
	ProviderSerpAPI SearchProvider = "serpapi"
	ProviderBing   SearchProvider = "bing"
	ProviderExa    SearchProvider = "exa"
)

// Freshness 时效性筛选
type Freshness string

const (
	FreshnessDay   Freshness = "day"
	FreshnessWeek  Freshness = "week"
	FreshnessMonth Freshness = "month"
	FreshnessYear  Freshness = "year"
)

// SearchOptions 搜索选项
type SearchOptions struct {
	// 最大返回结果数
	MaxResults int `json:"max_results"`
	
	// 时效性筛选
	Freshness Freshness `json:"freshness,omitempty"`
	
	// 搜索语言 (如 "zh-CN", "en-US")
	Language string `json:"language,omitempty"`
	
	// 地区 (如 "CN", "US")
	Region string `json:"region,omitempty"`
	
	// 是否包含原始内容 (用于 AI 处理)
	IncludeRawContent bool `json:"include_raw_content,omitempty"`
	
	// 是否包含摘要 (Tavily 专用)
	IncludeSummary bool `json:"include_summary,omitempty"`
	
	// 搜索深度 (basic/advanced)
	SearchDepth string `json:"search_depth,omitempty"`
	
	// 超时时间
	Timeout time.Duration `json:"-"`
}

// DefaultSearchOptions 返回默认搜索选项
func DefaultSearchOptions() SearchOptions {
	return SearchOptions{
		MaxResults:        10,
		Freshness:         FreshnessMonth,
		Language:          "zh-CN",
		IncludeRawContent: false,
		IncludeSummary:    true,
		SearchDepth:       "basic",
		Timeout:           30 * time.Second,
	}
}

// SearchResult 搜索结果
type SearchResult struct {
	// 标题
	Title string `json:"title"`
	
	// URL
	URL string `json:"url"`
	
	// 摘要/片段
	Snippet string `json:"snippet"`
	
	// 发布日期
	PublishedDate string `json:"published_date,omitempty"`
	
	// 来源名称
	Source string `json:"source"`
	
	// 相关性得分 (0-1)
	Score float64 `json:"score,omitempty"`
	
	// 原始内容 (可选)
	RawContent string `json:"raw_content,omitempty"`
}

// SearchResponse 搜索响应
type SearchResponse struct {
	// 查询词
	Query string `json:"query"`
	
	// 搜索结果列表
	Results []SearchResult `json:"results"`
	
	// AI 生成的摘要 (Tavily 专用)
	Summary string `json:"summary,omitempty"`
	
	// 响应时间 (毫秒)
	ResponseTimeMs int64 `json:"response_time_ms"`
	
	// 结果总数
	TotalResults int `json:"total_results"`
}

// MultiSearchRequest 多查询搜索请求
type MultiSearchRequest struct {
	// 查询列表
	Queries []string `json:"queries"`
	
	// 搜索选项 (所有查询共用)
	Options SearchOptions `json:"options"`
}

// MultiSearchResponse 多查询搜索响应
type MultiSearchResponse struct {
	// 各查询的响应
	Responses map[string]*SearchResponse `json:"responses"`
	
	// 总响应时间 (毫秒)
	TotalResponseTimeMs int64 `json:"total_response_time_ms"`
	
	// 失败的查询
	Errors map[string]string `json:"errors,omitempty"`
}

// SearchService 搜索服务接口
type SearchService interface {
	// Search 执行单个搜索
	Search(ctx context.Context, query string, options SearchOptions) (*SearchResponse, error)
	
	// MultiSearch 执行多个并行搜索
	MultiSearch(ctx context.Context, request MultiSearchRequest) (*MultiSearchResponse, error)
	
	// GetProvider 获取提供商名称
	GetProvider() SearchProvider
}
