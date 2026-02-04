package service

import (
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
)

const (
	PermissionMembersManage     = "members_manage"
	PermissionBillingManage     = "billing_manage"
	PermissionAppPublish        = "app_publish"
	PermissionAppEdit           = "app_edit"
	PermissionAppViewMetrics    = "app_view_metrics"
	PermissionLogsView          = "logs_view"
	PermissionWorkspaceAdmin    = "workspace_admin"
	PermissionAppsCreate        = "apps_create"
	PermissionWorkspaceDBAccess = "workspace_db_access"
	PermissionPlanView          = "plan_view"
	PermissionPlanManage        = "plan_manage"
	PermissionConnectorsManage  = "connectors_manage"
)

var defaultWorkspaceRolePermissions = map[string]entity.JSON{
	"owner": {
		PermissionMembersManage:     true,
		PermissionBillingManage:     true,
		PermissionAppPublish:        true,
		PermissionAppEdit:           true,
		PermissionAppViewMetrics:    true,
		PermissionLogsView:          true,
		PermissionWorkspaceAdmin:    true,
		PermissionAppsCreate:        true,
		PermissionWorkspaceDBAccess: true,
		PermissionPlanView:          true,
		PermissionPlanManage:        true,
		PermissionConnectorsManage:  true,
	},
	"admin": {
		PermissionMembersManage:     true,
		PermissionAppPublish:        true,
		PermissionAppEdit:           true,
		PermissionAppViewMetrics:    true,
		PermissionLogsView:          true,
		PermissionAppsCreate:        true,
		PermissionWorkspaceDBAccess: true,
		PermissionPlanView:          true,
		PermissionPlanManage:        true,
		PermissionConnectorsManage:  true,
	},
	"member": {
		PermissionAppEdit:           true,
		PermissionAppViewMetrics:    true,
		PermissionLogsView:          true,
		PermissionAppsCreate:        true,
		PermissionWorkspaceDBAccess: false,
		PermissionPlanView:          true,
		PermissionPlanManage:        false,
		PermissionConnectorsManage:  false,
	},
}

func hasPermission(permissions entity.JSON, key string) bool {
	if permissions == nil {
		return false
	}
	raw, ok := permissions[key]
	if !ok {
		return false
	}
	switch value := raw.(type) {
	case bool:
		return value
	case int:
		return value != 0
	case int64:
		return value != 0
	case float64:
		return value != 0
	case string:
		parsed, err := strconv.ParseBool(strings.TrimSpace(value))
		if err == nil {
			return parsed
		}
		return strings.TrimSpace(value) != ""
	default:
		return false
	}
}

func hasAnyPermission(permissions entity.JSON, keys ...string) bool {
	for _, key := range keys {
		if hasPermission(permissions, key) {
			return true
		}
	}
	return false
}
