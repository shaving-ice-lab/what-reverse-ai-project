package executor

import (
	"context"
	"database/sql"
)

// DBProvider 提供 Workspace DB 连接
type DBProvider interface {
	GetConnection(ctx context.Context, workspaceID string) (*sql.DB, error)
}

// DBAuthorizer 校验 Workspace DB 访问权限
type DBAuthorizer interface {
	EnsureAccess(ctx context.Context, workspaceID, userID string) error
}
