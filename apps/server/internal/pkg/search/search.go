package search

import (
	"errors"
	"os"
)

// Config 搜索服务配置
type Config struct {
	// 提供商类型
	Provider SearchProvider `json:"provider" yaml:"provider"`
	
	// API Key (各提供商通用)
	APIKey string `json:"api_key" yaml:"api_key"`
	
	// 基础 URL (可选，用于测试或自定义端点)
	BaseURL string `json:"base_url" yaml:"base_url"`
}

// NewSearchService 创建搜索服务实例
// 根据配置选择合适的提供商实现
func NewSearchService(config Config) (SearchService, error) {
	// 如果没有指定 API Key，尝试从环境变量读取
	apiKey := config.APIKey
	if apiKey == "" {
		switch config.Provider {
		case ProviderTavily, "":
			apiKey = os.Getenv("TAVILY_API_KEY")
		case ProviderSerpAPI:
			apiKey = os.Getenv("SERPAPI_API_KEY")
		case ProviderBing:
			apiKey = os.Getenv("BING_API_KEY")
		case ProviderExa:
			apiKey = os.Getenv("EXA_API_KEY")
		}
	}

	if apiKey == "" {
		return nil, errors.New("search API key is required")
	}

	// 根据提供商创建服务
	switch config.Provider {
	case ProviderTavily, "": // 默认使用 Tavily
		return NewTavilySearchService(TavilyConfig{
			APIKey:  apiKey,
			BaseURL: config.BaseURL,
		})
	
	case ProviderSerpAPI:
		// TODO: 实现 SerpAPI 支持
		return nil, errors.New("serpapi provider not implemented yet")
	
	case ProviderBing:
		// TODO: 实现 Bing Search API 支持
		return nil, errors.New("bing provider not implemented yet")
	
	case ProviderExa:
		// TODO: 实现 Exa AI 支持
		return nil, errors.New("exa provider not implemented yet")
	
	default:
		return nil, errors.New("unknown search provider: " + string(config.Provider))
	}
}

// MergeSearchResults 合并多个搜索结果，去重并按得分排序
func MergeSearchResults(responses map[string]*SearchResponse, maxResults int) []SearchResult {
	// 使用 URL 去重
	seen := make(map[string]bool)
	var merged []SearchResult

	for _, resp := range responses {
		if resp == nil {
			continue
		}
		for _, result := range resp.Results {
			if !seen[result.URL] {
				seen[result.URL] = true
				merged = append(merged, result)
			}
		}
	}

	// 按得分排序 (降序)
	for i := 0; i < len(merged)-1; i++ {
		for j := i + 1; j < len(merged); j++ {
			if merged[j].Score > merged[i].Score {
				merged[i], merged[j] = merged[j], merged[i]
			}
		}
	}

	// 限制结果数量
	if maxResults > 0 && len(merged) > maxResults {
		merged = merged[:maxResults]
	}

	return merged
}

// FormatResultsForLLM 将搜索结果格式化为适合 LLM 处理的文本
func FormatResultsForLLM(results []SearchResult, includeSummary bool) string {
	if len(results) == 0 {
		return "没有找到相关搜索结果。"
	}

	var text string
	text = "以下是搜索结果：\n\n"

	for i, r := range results {
		text += "---\n"
		text += "来源 " + string(rune('0'+i+1)) + ": " + r.Source + "\n"
		text += "标题: " + r.Title + "\n"
		text += "链接: " + r.URL + "\n"
		if r.PublishedDate != "" {
			text += "发布时间: " + r.PublishedDate + "\n"
		}
		text += "内容摘要:\n" + r.Snippet + "\n\n"
	}

	return text
}

// CombineSummaries 合并多个搜索的 AI 摘要
func CombineSummaries(responses map[string]*SearchResponse) string {
	var summaries []string

	for query, resp := range responses {
		if resp != nil && resp.Summary != "" {
			summaries = append(summaries, "【"+query+"】\n"+resp.Summary)
		}
	}

	if len(summaries) == 0 {
		return ""
	}

	result := "搜索摘要：\n\n"
	for _, s := range summaries {
		result += s + "\n\n"
	}

	return result
}
