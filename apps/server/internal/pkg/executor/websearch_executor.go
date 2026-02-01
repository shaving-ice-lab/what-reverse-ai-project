package executor

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/pkg/search"
)

var (
	// ErrInvalidSearchConfig 无效的搜索配置
	ErrInvalidSearchConfig = errors.New("invalid search configuration: no query provided")
)

// ========================
// WebSearch 节点配置结构
// ========================

// WebSearchNodeConfig Web Search 节点配置
type WebSearchNodeConfig struct {
	// 搜索查询 (支持变量插值)
	Query string `json:"query"`

	// 多个查询 (支持并行搜索)
	Queries []string `json:"queries,omitempty"`

	// 最大结果数量
	MaxResults int `json:"maxResults"`

	// 时效性筛选: day, week, month, year
	Freshness string `json:"freshness"`

	// 搜索语言: zh-CN, en-US 等
	Language string `json:"language"`

	// 地区筛选: CN, US 等
	Region string `json:"region"`

	// 是否包含原始内容
	IncludeRawContent bool `json:"includeRawContent"`

	// 是否包含 AI 摘要
	IncludeSummary bool `json:"includeSummary"`

	// 搜索深度: basic, advanced
	SearchDepth string `json:"searchDepth"`

	// 超时时间 (秒)
	Timeout int `json:"timeout"`
}

// WebSearchNodeOutput Web Search 节点输出
type WebSearchNodeOutput struct {
	// 查询词
	Query string `json:"query"`

	// 搜索结果列表
	Results []WebSearchResult `json:"results"`

	// AI 生成的摘要
	Summary string `json:"summary,omitempty"`

	// 格式化后的结果文本 (适合 LLM 处理)
	FormattedResults string `json:"formattedResults"`

	// 响应时间 (毫秒)
	ResponseTimeMs int64 `json:"responseTimeMs"`

	// 结果总数
	TotalResults int `json:"totalResults"`

	// 各查询的独立结果 (多查询时使用)
	QueryResults map[string][]WebSearchResult `json:"queryResults,omitempty"`
}

// WebSearchResult 单个搜索结果
type WebSearchResult struct {
	Title         string  `json:"title"`
	URL           string  `json:"url"`
	Snippet       string  `json:"snippet"`
	PublishedDate string  `json:"publishedDate,omitempty"`
	Source        string  `json:"source"`
	Score         float64 `json:"score,omitempty"`
	RawContent    string  `json:"rawContent,omitempty"`
}

// ========================
// WebSearch 节点执行器
// ========================

// WebSearchExecutor Web Search 节点执行器
type WebSearchExecutor struct {
	searchService search.SearchService
}

// NewWebSearchExecutor 创建 WebSearch 执行器
func NewWebSearchExecutor(searchService search.SearchService) *WebSearchExecutor {
	return &WebSearchExecutor{
		searchService: searchService,
	}
}

// GetType 获取节点类型
func (e *WebSearchExecutor) GetType() NodeType {
	return NodeTypeWebSearch
}

// Execute 执行节点
func (e *WebSearchExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	startTime := time.Now()

	// 解析配置
	config := e.parseConfig(node.Config)

	// 处理查询变量替换
	queries := e.processQueries(config, inputs, execCtx)

	if len(queries) == 0 {
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusFailed,
			Error:   ErrInvalidSearchConfig,
			Outputs: map[string]interface{}{
				"error": "no search query provided",
			},
		}, nil
	}

	// 构建搜索选项
	options := e.buildSearchOptions(config)

	var output WebSearchNodeOutput
	var err error

	if len(queries) == 1 {
		// 单查询搜索
		output, err = e.executeSingleSearch(ctx, queries[0], options)
	} else {
		// 多查询并行搜索
		output, err = e.executeMultiSearch(ctx, queries, options)
	}

	if err != nil {
		return &NodeResult{
			NodeID:     node.ID,
			Status:     NodeStatusFailed,
			Error:      err,
			StartedAt:  startTime,
			FinishedAt: time.Now(),
			DurationMs: int(time.Since(startTime).Milliseconds()),
			Outputs: map[string]interface{}{
				"error": err.Error(),
			},
		}, nil
	}

	// 构建输出
	outputs := map[string]interface{}{
		"query":            output.Query,
		"results":          output.Results,
		"summary":          output.Summary,
		"formattedResults": output.FormattedResults,
		"responseTimeMs":   output.ResponseTimeMs,
		"totalResults":     output.TotalResults,
	}

	if len(output.QueryResults) > 0 {
		outputs["queryResults"] = output.QueryResults
	}

	return &NodeResult{
		NodeID:     node.ID,
		Status:     NodeStatusCompleted,
		Outputs:    outputs,
		StartedAt:  startTime,
		FinishedAt: time.Now(),
		DurationMs: int(time.Since(startTime).Milliseconds()),
	}, nil
}

// parseConfig 解析节点配置
func (e *WebSearchExecutor) parseConfig(config map[string]interface{}) WebSearchNodeConfig {
	c := WebSearchNodeConfig{
		MaxResults:     10,
		Freshness:      "month",
		Language:       "zh-CN",
		IncludeSummary: true,
		SearchDepth:    "basic",
		Timeout:        30,
	}

	if v, ok := config["query"].(string); ok {
		c.Query = v
	}

	if v, ok := config["queries"].([]interface{}); ok {
		for _, q := range v {
			if qs, ok := q.(string); ok {
				c.Queries = append(c.Queries, qs)
			}
		}
	}

	if v, ok := config["maxResults"].(float64); ok {
		c.MaxResults = int(v)
	}

	if v, ok := config["freshness"].(string); ok {
		c.Freshness = v
	}

	if v, ok := config["language"].(string); ok {
		c.Language = v
	}

	if v, ok := config["region"].(string); ok {
		c.Region = v
	}

	if v, ok := config["includeRawContent"].(bool); ok {
		c.IncludeRawContent = v
	}

	if v, ok := config["includeSummary"].(bool); ok {
		c.IncludeSummary = v
	}

	if v, ok := config["searchDepth"].(string); ok {
		c.SearchDepth = v
	}

	if v, ok := config["timeout"].(float64); ok {
		c.Timeout = int(v)
	}

	return c
}

// processQueries 处理查询并进行变量替换
func (e *WebSearchExecutor) processQueries(config WebSearchNodeConfig, inputs map[string]interface{}, execCtx *ExecutionContext) []string {
	var queries []string

	// 处理单个查询
	if config.Query != "" {
		// interpolateVariables 返回 string 类型
		queryStr := interpolateVariables(config.Query, inputs, execCtx)
		if strings.TrimSpace(queryStr) != "" {
			queries = append(queries, strings.TrimSpace(queryStr))
		}
	}

	// 处理多个查询
	for _, query := range config.Queries {
		queryStr := interpolateVariables(query, inputs, execCtx)
		if strings.TrimSpace(queryStr) != "" {
			queries = append(queries, strings.TrimSpace(queryStr))
		}
	}

	return queries
}

// buildSearchOptions 构建搜索选项
func (e *WebSearchExecutor) buildSearchOptions(config WebSearchNodeConfig) search.SearchOptions {
	options := search.DefaultSearchOptions()

	// 结果数量限制
	if config.MaxResults > 0 {
		options.MaxResults = config.MaxResults
		// 限制最大结果数
		if options.MaxResults > 20 {
			options.MaxResults = 20
		}
	}

	// 时效性筛选
	if config.Freshness != "" {
		switch config.Freshness {
		case "day":
			options.Freshness = search.FreshnessDay
		case "week":
			options.Freshness = search.FreshnessWeek
		case "month":
			options.Freshness = search.FreshnessMonth
		case "year":
			options.Freshness = search.FreshnessYear
		}
	}

	// 语言筛选
	if config.Language != "" {
		options.Language = config.Language
	}

	// 地区筛选
	if config.Region != "" {
		options.Region = config.Region
	}

	// 原始内容
	options.IncludeRawContent = config.IncludeRawContent

	// AI 摘要
	options.IncludeSummary = config.IncludeSummary

	// 搜索深度
	if config.SearchDepth != "" {
		options.SearchDepth = config.SearchDepth
	}

	// 超时
	if config.Timeout > 0 {
		options.Timeout = time.Duration(config.Timeout) * time.Second
	}

	return options
}

// executeSingleSearch 执行单个搜索
func (e *WebSearchExecutor) executeSingleSearch(ctx context.Context, query string, options search.SearchOptions) (WebSearchNodeOutput, error) {
	resp, err := e.searchService.Search(ctx, query, options)
	if err != nil {
		return WebSearchNodeOutput{}, err
	}

	results := e.convertResults(resp.Results)

	return WebSearchNodeOutput{
		Query:            query,
		Results:          results,
		Summary:          resp.Summary,
		FormattedResults: search.FormatResultsForLLM(resp.Results, options.IncludeSummary),
		ResponseTimeMs:   resp.ResponseTimeMs,
		TotalResults:     resp.TotalResults,
	}, nil
}

// executeMultiSearch 执行多个并行搜索
func (e *WebSearchExecutor) executeMultiSearch(ctx context.Context, queries []string, options search.SearchOptions) (WebSearchNodeOutput, error) {
	resp, err := e.searchService.MultiSearch(ctx, search.MultiSearchRequest{
		Queries: queries,
		Options: options,
	})
	if err != nil {
		return WebSearchNodeOutput{}, err
	}

	// 合并所有结果
	mergedResults := search.MergeSearchResults(resp.Responses, options.MaxResults)
	results := e.convertResults(mergedResults)

	// 收集各查询的独立结果
	queryResults := make(map[string][]WebSearchResult)
	for query, qResp := range resp.Responses {
		if qResp != nil {
			queryResults[query] = e.convertResults(qResp.Results)
		}
	}

	// 合并摘要
	combinedSummary := search.CombineSummaries(resp.Responses)

	return WebSearchNodeOutput{
		Query:            strings.Join(queries, "; "),
		Results:          results,
		Summary:          combinedSummary,
		FormattedResults: search.FormatResultsForLLM(mergedResults, options.IncludeSummary),
		ResponseTimeMs:   resp.TotalResponseTimeMs,
		TotalResults:     len(results),
		QueryResults:     queryResults,
	}, nil
}

// convertResults 转换搜索结果格式
func (e *WebSearchExecutor) convertResults(results []search.SearchResult) []WebSearchResult {
	converted := make([]WebSearchResult, len(results))
	for i, r := range results {
		converted[i] = WebSearchResult{
			Title:         r.Title,
			URL:           r.URL,
			Snippet:       r.Snippet,
			PublishedDate: r.PublishedDate,
			Source:        r.Source,
			Score:         r.Score,
			RawContent:    r.RawContent,
		}
	}
	return converted
}
