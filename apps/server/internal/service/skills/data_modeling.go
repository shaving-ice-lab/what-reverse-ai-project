package skills

import (
	"github.com/agentflow/server/internal/service"
	"github.com/agentflow/server/internal/service/agent_tools"
)

// NewDataModelingSkill 创建 Data Modeling Skill
func NewDataModelingSkill(dbQueryService service.WorkspaceDBQueryService) *service.Skill {
	return &service.Skill{
		ID:          "builtin_data_modeling",
		Name:        "Data Modeling",
		Description: "Design and manage database schemas. Create tables, modify structures, insert seed data, and query data with visual SQL builder support.",
		Category:    service.SkillCategoryDataModeling,
		Icon:        "Database",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			agent_tools.NewCreateTableTool(dbQueryService),
			agent_tools.NewAlterTableTool(dbQueryService),
			agent_tools.NewInsertDataTool(dbQueryService),
			agent_tools.NewQueryDataTool(dbQueryService),
		},
		SystemPromptAddition: `You are an expert database architect. When designing data models:
- Use normalized table structures (3NF) unless denormalization is justified for performance
- Always include an auto-increment primary key (id BIGINT AUTO_INCREMENT)
- Add created_at DATETIME DEFAULT CURRENT_TIMESTAMP and updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
- Choose appropriate column types: VARCHAR for short text, TEXT for long content, INT/BIGINT for integers, DECIMAL for money, DATETIME for timestamps
- Add NOT NULL constraints where appropriate
- Use foreign keys to express relationships
- Add indexes on columns frequently used in WHERE, JOIN, and ORDER BY clauses
- Use meaningful table and column names in snake_case`,
	}
}
