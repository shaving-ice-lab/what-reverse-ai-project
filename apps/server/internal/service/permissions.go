package service

import (
	"strconv"
	"strings"

	"github.com/reverseai/server/internal/domain/entity"
)

const (
	PermissionMembersManage        = "members_manage"
	PermissionBillingManage        = "billing_manage"
	PermissionWorkspacePublish     = "workspace_publish"
	PermissionWorkspaceEdit        = "workspace_edit"
	PermissionWorkspaceViewMetrics = "workspace_view_metrics"
	PermissionLogsView             = "logs_view"
	PermissionWorkspaceAdmin       = "workspace_admin"
	PermissionWorkspaceCreate      = "workspace_create"
	PermissionWorkspaceDBAccess    = "workspace_db_access"
	PermissionPlanView             = "plan_view"
	PermissionPlanManage           = "plan_manage"
	PermissionConnectorsManage     = "connectors_manage"
)

var defaultWorkspaceRolePermissions = map[string]entity.JSON{
	"owner": {
		PermissionMembersManage:        true,
		PermissionBillingManage:        true,
		PermissionWorkspacePublish:     true,
		PermissionWorkspaceEdit:        true,
		PermissionWorkspaceViewMetrics: true,
		PermissionLogsView:             true,
		PermissionWorkspaceAdmin:       true,
		PermissionWorkspaceCreate:      true,
		PermissionWorkspaceDBAccess:    true,
		PermissionPlanView:             true,
		PermissionPlanManage:           true,
		PermissionConnectorsManage:     true,
	},
	"admin": {
		PermissionMembersManage:        true,
		PermissionWorkspacePublish:     true,
		PermissionWorkspaceEdit:        true,
		PermissionWorkspaceViewMetrics: true,
		PermissionLogsView:             true,
		PermissionWorkspaceCreate:      true,
		PermissionWorkspaceDBAccess:    true,
		PermissionPlanView:             true,
		PermissionPlanManage:           true,
		PermissionConnectorsManage:     true,
	},
	"member": {
		PermissionWorkspaceEdit:        true,
		PermissionWorkspaceViewMetrics: true,
		PermissionLogsView:             true,
		PermissionWorkspaceCreate:      true,
		PermissionWorkspaceDBAccess:    false,
		PermissionPlanView:             true,
		PermissionPlanManage:           false,
		PermissionConnectorsManage:     false,
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
