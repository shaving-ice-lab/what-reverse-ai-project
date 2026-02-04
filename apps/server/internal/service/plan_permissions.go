package service

import (
	"context"

	"github.com/google/uuid"
)

func ensurePlanView(ctx context.Context, workspaceSvc WorkspaceService, workspaceID, userID uuid.UUID) error {
	access, err := workspaceSvc.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !hasAnyPermission(access.Permissions, PermissionPlanView, PermissionPlanManage, PermissionWorkspaceAdmin) {
		return ErrWorkspaceUnauthorized
	}
	return nil
}

func ensurePlanManage(ctx context.Context, workspaceSvc WorkspaceService, workspaceID, userID uuid.UUID) error {
	access, err := workspaceSvc.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !hasAnyPermission(access.Permissions, PermissionPlanManage, PermissionWorkspaceAdmin) {
		return ErrWorkspaceUnauthorized
	}
	return nil
}
