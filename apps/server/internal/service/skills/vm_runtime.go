package skills

import (
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/service/agent_tools"
	"github.com/reverseai/server/internal/vmruntime"
)

// NewVMRuntimeSkill 创建 VM Runtime Skill
// Provides tools for deploying JS logic code, retrieving deployed code, and querying VM SQLite data.
func NewVMRuntimeSkill(
	workspaceService service.WorkspaceService,
	vmPool *vmruntime.VMPool,
	vmStore *vmruntime.VMStore,
) *service.Skill {
	return &service.Skill{
		ID:          "builtin_vm_runtime",
		Name:        "VM Runtime",
		Description: "Deploy and manage JavaScript business logic in the workspace VM runtime. Query the workspace's SQLite database directly.",
		Category:    service.SkillCategoryBusinessLogic,
		Icon:        "Terminal",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			agent_tools.NewDeployLogicTool(workspaceService, vmPool),
			agent_tools.NewGetLogicTool(workspaceService),
			agent_tools.NewQueryVMDataTool(vmStore),
		},
		SystemPromptAddition: `You can deploy JavaScript business logic to workspace VM runtimes. The JS code runs in a sandboxed goja VM with access to a 'db' object for SQLite operations. Routes are defined via exports.routes. After deploying, the API is available at /runtime/{slug}/api/{path}. Always create database tables (via query_vm_data with CREATE TABLE) before deploying logic that references them.`,
	}
}
