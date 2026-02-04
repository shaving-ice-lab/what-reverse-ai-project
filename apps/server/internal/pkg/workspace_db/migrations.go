package workspace_db

import (
	"embed"
	"fmt"
	"strings"
)

// Migration 工作空间数据库迁移定义
type Migration struct {
	Version string
	UpSQL   string
	DownSQL string
}

type migrationFiles struct {
	version string
	up      string
	down    string
}

//go:embed migrations/*.sql
var migrationFS embed.FS

var migrationList = []migrationFiles{
	{
		version: "001_init_workspace_meta",
		up:      "migrations/001_init_workspace_meta.up.sql",
		down:    "migrations/001_init_workspace_meta.down.sql",
	},
}

// LoadMigrations 读取迁移脚本
func LoadMigrations() ([]Migration, error) {
	result := make([]Migration, 0, len(migrationList))
	for _, item := range migrationList {
		upSQL, err := migrationFS.ReadFile(item.up)
		if err != nil {
			return nil, fmt.Errorf("read migration up %s: %w", item.up, err)
		}
		downSQL, err := migrationFS.ReadFile(item.down)
		if err != nil {
			return nil, fmt.Errorf("read migration down %s: %w", item.down, err)
		}
		result = append(result, Migration{
			Version: item.version,
			UpSQL:   strings.TrimSpace(string(upSQL)),
			DownSQL: strings.TrimSpace(string(downSQL)),
		})
	}
	return result, nil
}
