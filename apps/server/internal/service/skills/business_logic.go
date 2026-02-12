package skills

import (
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/service/agent_tools"
)

// NewBusinessLogicSkill 创建 Business Logic Skill
// Provides workspace introspection tools (database schema, table listing, etc.)
func NewBusinessLogicSkill(
	dbQueryService service.WorkspaceDBQueryService,
) *service.Skill {
	return &service.Skill{
		ID:          "builtin_business_logic",
		Name:        "Business Logic",
		Description: "Inspect workspace context — list tables, query schema, and understand the current database state to inform app building decisions.",
		Category:    service.SkillCategoryBusinessLogic,
		Icon:        "Database",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			agent_tools.NewGetWorkspaceInfoTool(dbQueryService),
		},
		SystemPromptAddition: `When building apps, always start by inspecting the workspace to understand existing tables and schema before creating new resources.`,
	}
}
