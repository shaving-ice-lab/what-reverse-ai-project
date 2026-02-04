package service

import (
	"context"
	"errors"
)

// OpenAPITemplate OpenAPI 规范输出模板
type OpenAPITemplate struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	SpecVersion string   `json:"spec_version"`
	Format      string   `json:"format"`
	Source      string   `json:"source"`
	OutputPath  string   `json:"output_path"`
	Template    string   `json:"template"`
	Notes       []string `json:"notes,omitempty"`
}

// SDKTargetLanguage SDK 目标语言
type SDKTargetLanguage struct {
	Key         string   `json:"key"`
	Language    string   `json:"language"`
	Priority    string   `json:"priority"`
	Generator   string   `json:"generator"`
	PackageName string   `json:"package_name"`
	Registry    string   `json:"registry"`
	Status      string   `json:"status"`
	Notes       []string `json:"notes,omitempty"`
}

// SDKTargetPlan SDK 目标语言清单
type SDKTargetPlan struct {
	Key       string              `json:"key"`
	Title     string              `json:"title"`
	Languages []SDKTargetLanguage `json:"languages"`
	Notes     []string            `json:"notes,omitempty"`
}

// SDKPipelineStep SDK 生成流水线步骤
type SDKPipelineStep struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Commands    []string `json:"commands,omitempty"`
	Inputs      []string `json:"inputs,omitempty"`
	Outputs     []string `json:"outputs,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// SDKPipeline SDK 生成与发布流水线
type SDKPipeline struct {
	Key   string            `json:"key"`
	Title string            `json:"title"`
	Steps []SDKPipelineStep `json:"steps"`
	Notes []string          `json:"notes,omitempty"`
}

// OpenAPISDKPlan OpenAPI 与 SDK 生成计划
type OpenAPISDKPlan struct {
	Key             string          `json:"key"`
	Title           string          `json:"title"`
	OpenAPITemplate OpenAPITemplate `json:"openapi_template"`
	SDKTargets      SDKTargetPlan   `json:"sdk_targets"`
	Pipeline        SDKPipeline     `json:"pipeline"`
	Notes           []string        `json:"notes,omitempty"`
}

// PlanOpenAPISDKService OpenAPI 与 SDK 生成规划服务接口
type PlanOpenAPISDKService interface {
	GetPlan(ctx context.Context) (*OpenAPISDKPlan, error)
}

type planOpenAPISDKService struct {
	plan OpenAPISDKPlan
}

// ErrOpenAPISDKPlanNotFound OpenAPI 与 SDK 生成计划不存在
var ErrOpenAPISDKPlanNotFound = errors.New("openapi sdk plan not found")

// NewPlanOpenAPISDKService 创建 OpenAPI 与 SDK 生成规划服务
func NewPlanOpenAPISDKService() PlanOpenAPISDKService {
	return &planOpenAPISDKService{
		plan: defaultOpenAPISDKPlan(),
	}
}

func (s *planOpenAPISDKService) GetPlan(ctx context.Context) (*OpenAPISDKPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrOpenAPISDKPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultOpenAPISDKPlan() OpenAPISDKPlan {
	openapiTemplate := `openapi: 3.0.3
info:
  title: "{{title}}"
  version: "{{version}}"
  description: "{{description}}"
servers:
  - url: "{{base_url}}"
    description: "Primary API"
security:
  - BearerAuth: []
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
paths: {}`

	return OpenAPISDKPlan{
		Key:   "openapi_sdk_generation",
		Title: "OpenAPI 与 SDK 生成计划",
		OpenAPITemplate: OpenAPITemplate{
			Key:         "openapi_template",
			Title:       "OpenAPI 规范输出模板",
			SpecVersion: "3.0.3",
			Format:      "yaml",
			Source:      "apps/server/docs/swagger/swagger.json",
			OutputPath:  "apps/server/docs/openapi/openapi.yaml",
			Template:    openapiTemplate,
			Notes: []string{
				"Swagger 2.0 由 swag 生成，可通过转换输出 OpenAPI 3.0。",
				"模板中的占位符用于 CI/CD 替换。",
			},
		},
		SDKTargets: SDKTargetPlan{
			Key:   "sdk_languages",
			Title: "SDK 目标语言清单",
			Languages: []SDKTargetLanguage{
				{
					Key:         "typescript",
					Language:    "TypeScript",
					Priority:    "P0",
					Generator:   "typescript-fetch",
					PackageName: "@agentflow/sdk",
					Registry:    "npm",
					Status:      "planned",
					Notes: []string{
						"覆盖前端与 Node 生态。",
					},
				},
				{
					Key:         "python",
					Language:    "Python",
					Priority:    "P0",
					Generator:   "python",
					PackageName: "agentflow-sdk",
					Registry:    "pypi",
					Status:      "planned",
					Notes: []string{
						"数据分析与自动化场景优先。",
					},
				},
				{
					Key:         "go",
					Language:    "Go",
					Priority:    "P1",
					Generator:   "go",
					PackageName: "github.com/agentflow/sdk-go",
					Registry:    "go module",
					Status:      "planned",
				},
				{
					Key:         "java",
					Language:    "Java",
					Priority:    "P1",
					Generator:   "java",
					PackageName: "com.agentflow:agentflow-sdk",
					Registry:    "maven",
					Status:      "planned",
				},
				{
					Key:         "csharp",
					Language:    "C#",
					Priority:    "P2",
					Generator:   "csharp",
					PackageName: "AgentFlow.SDK",
					Registry:    "nuget",
					Status:      "planned",
				},
			},
			Notes: []string{
				"优先级依据使用覆盖面与生态成熟度排序。",
			},
		},
		Pipeline: SDKPipeline{
			Key:   "sdk_pipeline",
			Title: "自动化生成与发布流程",
			Steps: []SDKPipelineStep{
				{
					Key:         "spec_generate",
					Title:       "生成 Swagger 规范",
					Description: "基于后端注释生成 Swagger 2.0 JSON。",
					Commands: []string{
						"make -C apps/server swagger",
					},
					Outputs: []string{
						"apps/server/docs/swagger/swagger.json",
					},
				},
				{
					Key:         "spec_convert",
					Title:       "转换为 OpenAPI 3.0",
					Description: "将 Swagger 2.0 转换为 OpenAPI 3.0 YAML。",
					Commands: []string{
						"npx @apidevtools/swagger2openapi apps/server/docs/swagger/swagger.json -o apps/server/docs/openapi/openapi.yaml",
					},
					Inputs: []string{
						"apps/server/docs/swagger/swagger.json",
					},
					Outputs: []string{
						"apps/server/docs/openapi/openapi.yaml",
					},
					Notes: []string{
						"如需锁定版本，可将 swagger2openapi 作为 CI 依赖。",
					},
				},
				{
					Key:         "sdk_generate",
					Title:       "生成 SDK",
					Description: "按语言生成 SDK 客户端代码。",
					Commands: []string{
						"npx @openapitools/openapi-generator-cli generate -i apps/server/docs/openapi/openapi.yaml -g typescript-fetch -o packages/sdk-generated/typescript --additional-properties=npmName=@agentflow/sdk,npmVersion={{version}}",
						"npx @openapitools/openapi-generator-cli generate -i apps/server/docs/openapi/openapi.yaml -g python -o packages/sdk-generated/python --additional-properties=packageName=agentflow_sdk,projectName=agentflow-sdk,packageVersion={{version}}",
					},
					Inputs: []string{
						"apps/server/docs/openapi/openapi.yaml",
					},
					Outputs: []string{
						"packages/sdk-generated/typescript",
						"packages/sdk-generated/python",
					},
					Notes: []string{
						"其他语言使用对应 generator 与输出目录。",
					},
				},
				{
					Key:         "sdk_publish",
					Title:       "发布 SDK",
					Description: "将生成产物发布到目标仓库。",
					Commands: []string{
						"npm publish packages/sdk-generated/typescript",
						"python -m build packages/sdk-generated/python && python -m twine upload packages/sdk-generated/python/dist/*",
						"git tag sdk-v{{version}} && git push origin sdk-v{{version}}",
					},
					Inputs: []string{
						"packages/sdk-generated/typescript",
						"packages/sdk-generated/python",
					},
					Notes: []string{
						"发布前运行 SDK 测试与 lint 校验。",
					},
				},
			},
			Notes: []string{
				"流水线支持在 CI 中以矩阵方式并行生成多语言 SDK。",
			},
		},
		Notes: []string{
			"模板与流水线可直接对接 CI/CD。",
		},
	}
}
