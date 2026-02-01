package search

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

const (
	// TavilyAPIBaseURL Tavily API 基础地址
	TavilyAPIBaseURL = "https://api.tavily.com"
)

// TavilySearchService Tavily 搜索服务实现
type TavilySearchService struct {
	apiKey     string
	httpClient *http.Client
	baseURL    string
}

// TavilyConfig Tavily 配置
type TavilyConfig struct {
	APIKey  string
	BaseURL string // 可选，用于测试
	Timeout time.Duration
}

// NewTavilySearchService 创建 Tavily 搜索服务
func NewTavilySearchService(config TavilyConfig) (*TavilySearchService, error) {
	if config.APIKey == "" {
		return nil, errors.New("tavily API key is required")
	}

	baseURL := config.BaseURL
	if baseURL == "" {
		baseURL = TavilyAPIBaseURL
	}

	timeout := config.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	return &TavilySearchService{
		apiKey:  config.APIKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}, nil
}

// tavilySearchRequest Tavily API 搜索请求
type tavilySearchRequest struct {
	APIKey            string   `json:"api_key"`
	Query             string   `json:"query"`
	SearchDepth       string   `json:"search_depth,omitempty"`
	IncludeAnswer     bool     `json:"include_answer,omitempty"`
	IncludeRawContent bool     `json:"include_raw_content,omitempty"`
	MaxResults        int      `json:"max_results,omitempty"`
	IncludeDomains    []string `json:"include_domains,omitempty"`
	ExcludeDomains    []string `json:"exclude_domains,omitempty"`
}

// tavilySearchResponse Tavily API 搜索响应
type tavilySearchResponse struct {
	Answer          string               `json:"answer"`
	Query           string               `json:"query"`
	ResponseTime    float64              `json:"response_time"`
	Images          []string             `json:"images"`
	FollowUpQuestions []string           `json:"follow_up_questions"`
	Results         []tavilySearchResult `json:"results"`
}

// tavilySearchResult Tavily 搜索结果项
type tavilySearchResult struct {
	Title         string  `json:"title"`
	URL           string  `json:"url"`
	Content       string  `json:"content"`
	Score         float64 `json:"score"`
	PublishedDate string  `json:"published_date"`
	RawContent    string  `json:"raw_content,omitempty"`
}

// Search 执行单个搜索
func (s *TavilySearchService) Search(ctx context.Context, query string, options SearchOptions) (*SearchResponse, error) {
	startTime := time.Now()

	// 构建请求
	reqBody := tavilySearchRequest{
		APIKey:            s.apiKey,
		Query:             query,
		SearchDepth:       options.SearchDepth,
		IncludeAnswer:     options.IncludeSummary,
		IncludeRawContent: options.IncludeRawContent,
		MaxResults:        options.MaxResults,
	}

	if reqBody.SearchDepth == "" {
		reqBody.SearchDepth = "basic"
	}
	if reqBody.MaxResults == 0 {
		reqBody.MaxResults = 10
	}

	// 序列化请求
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// 创建 HTTP 请求
	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/search", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// 发送请求
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tavily API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var tavilyResp tavilySearchResponse
	if err := json.Unmarshal(body, &tavilyResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// 转换为通用格式
	results := make([]SearchResult, len(tavilyResp.Results))
	for i, r := range tavilyResp.Results {
		results[i] = SearchResult{
			Title:         r.Title,
			URL:           r.URL,
			Snippet:       r.Content,
			PublishedDate: r.PublishedDate,
			Source:        extractDomain(r.URL),
			Score:         r.Score,
			RawContent:    r.RawContent,
		}
	}

	responseTimeMs := time.Since(startTime).Milliseconds()

	return &SearchResponse{
		Query:          query,
		Results:        results,
		Summary:        tavilyResp.Answer,
		ResponseTimeMs: responseTimeMs,
		TotalResults:   len(results),
	}, nil
}

// MultiSearch 执行多个并行搜索
func (s *TavilySearchService) MultiSearch(ctx context.Context, request MultiSearchRequest) (*MultiSearchResponse, error) {
	startTime := time.Now()

	if len(request.Queries) == 0 {
		return nil, errors.New("no queries provided")
	}

	// 限制并发数量
	maxConcurrent := 5
	if len(request.Queries) < maxConcurrent {
		maxConcurrent = len(request.Queries)
	}

	// 创建结果通道
	type searchResult struct {
		query    string
		response *SearchResponse
		err      error
	}

	results := make(chan searchResult, len(request.Queries))
	semaphore := make(chan struct{}, maxConcurrent)

	var wg sync.WaitGroup

	// 并行执行搜索
	for _, query := range request.Queries {
		wg.Add(1)
		go func(q string) {
			defer wg.Done()

			// 获取信号量
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// 检查上下文是否已取消
			select {
			case <-ctx.Done():
				results <- searchResult{query: q, err: ctx.Err()}
				return
			default:
			}

			// 执行搜索
			resp, err := s.Search(ctx, q, request.Options)
			results <- searchResult{
				query:    q,
				response: resp,
				err:      err,
			}
		}(query)
	}

	// 等待所有搜索完成
	go func() {
		wg.Wait()
		close(results)
	}()

	// 收集结果
	responses := make(map[string]*SearchResponse)
	errors := make(map[string]string)

	for result := range results {
		if result.err != nil {
			errors[result.query] = result.err.Error()
		} else {
			responses[result.query] = result.response
		}
	}

	totalResponseTimeMs := time.Since(startTime).Milliseconds()

	response := &MultiSearchResponse{
		Responses:           responses,
		TotalResponseTimeMs: totalResponseTimeMs,
	}

	if len(errors) > 0 {
		response.Errors = errors
	}

	return response, nil
}

// GetProvider 获取提供商名称
func (s *TavilySearchService) GetProvider() SearchProvider {
	return ProviderTavily
}

// extractDomain 从 URL 提取域名
func extractDomain(url string) string {
	// 简单实现，提取域名
	if len(url) < 10 {
		return url
	}

	// 移除协议
	start := 0
	if len(url) > 8 && url[:8] == "https://" {
		start = 8
	} else if len(url) > 7 && url[:7] == "http://" {
		start = 7
	}

	// 找到第一个斜杠
	end := len(url)
	for i := start; i < len(url); i++ {
		if url[i] == '/' {
			end = i
			break
		}
	}

	domain := url[start:end]

	// 移除 www.
	if len(domain) > 4 && domain[:4] == "www." {
		domain = domain[4:]
	}

	return domain
}
