package skills

import (
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/service/agent_tools"
	"github.com/reverseai/server/internal/vmruntime"
)

// NewDataModelingSkill 创建 Data Modeling Skill
func NewDataModelingSkill(vmStore *vmruntime.VMStore) *service.Skill {
	return &service.Skill{
		ID:          "builtin_data_modeling",
		Name:        "Data Modeling",
		Description: "Design and manage database schemas. Create tables, modify structures, insert seed data, and query data.",
		Category:    service.SkillCategoryDataModeling,
		Icon:        "Database",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			agent_tools.NewCreateTableTool(vmStore),
			agent_tools.NewAlterTableTool(vmStore),
			agent_tools.NewDeleteTableTool(vmStore),
			agent_tools.NewInsertDataTool(vmStore),
			agent_tools.NewUpdateDataTool(vmStore),
			agent_tools.NewDeleteDataTool(vmStore),
			agent_tools.NewQueryDataTool(vmStore),
		},
		SystemPromptAddition: `You are an expert database architect working with SQLite. When designing data models:
- Use normalized table structures (3NF) unless denormalization is justified for performance
- Always include an auto-increment primary key (id INTEGER PRIMARY KEY AUTOINCREMENT)
- Add created_at TEXT DEFAULT (datetime('now')) and updated_at TEXT DEFAULT (datetime('now'))
- Choose appropriate column types: TEXT for strings, INTEGER for integers, REAL for decimals/floats, BLOB for binary
- Use CHECK constraints instead of ENUM (e.g. CHECK(status IN ('active','inactive')))
- Add NOT NULL constraints where appropriate
- Use foreign keys to express relationships (PRAGMA foreign_keys=ON is enabled)
- Add indexes on columns frequently used in WHERE, JOIN, and ORDER BY clauses
- Use meaningful table and column names in snake_case`,
	}
}
