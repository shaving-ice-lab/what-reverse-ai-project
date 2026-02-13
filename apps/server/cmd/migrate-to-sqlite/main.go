package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/crypto"
	"github.com/reverseai/server/internal/pkg/database"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")

	var (
		dryRun      bool
		workspaceID string
	)
	flag.BoolVar(&dryRun, "dry-run", false, "Preview migration without executing")
	flag.StringVar(&workspaceID, "workspace", "", "Migrate only the specified workspace ID")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("❌ Failed to load config: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("🔄 MySQL → SQLite Workspace Data Migration Tool")
	fmt.Println("================================================")
	if dryRun {
		fmt.Println("⚠️  DRY-RUN mode: no changes will be made")
	}
	fmt.Printf("   VM base dir: %s\n", cfg.VMRuntime.BaseDir)
	fmt.Println()

	db, err := database.New(&cfg.Database)
	if err != nil {
		fmt.Printf("❌ Failed to connect to main database: %v\n", err)
		os.Exit(1)
	}
	{
		sqlDB, err := db.DB()
		if err != nil {
			fmt.Printf("❌ Failed to get sql.DB: %v\n", err)
			os.Exit(1)
		}
		defer sqlDB.Close()
	}
	fmt.Println("✅ Connected to main MySQL database")

	encryptor, err := crypto.NewEncryptor(cfg.Encryption.Key)
	if err != nil {
		fmt.Printf("❌ Failed to create encryptor: %v\n", err)
		os.Exit(1)
	}

	records, err := scanWorkspaceDatabases(db, workspaceID)
	if err != nil {
		fmt.Printf("❌ Failed to scan workspace databases: %v\n", err)
		os.Exit(1)
	}

	if len(records) == 0 {
		fmt.Println("ℹ️  No workspace databases found to migrate.")
		fmt.Println("   (Only records with status='ready' are eligible)")
		os.Exit(0)
	}
	fmt.Printf("📋 Found %d workspace database(s) to migrate\n\n", len(records))

	ctx := context.Background()
	var (
		successCount int
		failCount    int
		skipCount    int
	)

	for i, rec := range records {
		fmt.Printf("[%d/%d] Workspace: %s (DB: %s)\n", i+1, len(records), rec.WorkspaceID, rec.DBName)

		password, err := encryptor.Decrypt(rec.SecretRef)
		if err != nil {
			fmt.Printf("   ⚠️  Failed to decrypt password: %v — skipping\n", err)
			skipCount++
			continue
		}

		srcDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True", rec.DBUser, password, cfg.Database.Host, cfg.Database.Port, rec.DBName)

		if dryRun {
			tables, err := exportTables(ctx, srcDSN)
			if err != nil {
				fmt.Printf("   ⚠️  Failed to list tables: %v — skipping\n", err)
				skipCount++
				continue
			}
			fmt.Printf("   📊 Tables: %d", len(tables))
			for _, t := range tables {
				fmt.Printf(" [%s]", t.Name)
			}
			fmt.Println(" — would migrate (dry-run)")
			successCount++
			continue
		}

		start := time.Now()
		result, err := migrateWorkspace(ctx, rec, srcDSN, cfg.VMRuntime.BaseDir)
		elapsed := time.Since(start)

		if err != nil {
			fmt.Printf("   ❌ Migration failed: %v\n", err)
			failCount++
			continue
		}

		fmt.Printf("   ✅ Migrated %d table(s), %d total row(s) in %v\n", result.TableCount, result.TotalRows, elapsed.Round(time.Millisecond))

		if err := markAsMigrated(db, rec.ID); err != nil {
			fmt.Printf("   ⚠️  Failed to update status to 'migrated': %v\n", err)
		}
		successCount++
	}

	fmt.Println()
	fmt.Println("================================================")
	fmt.Printf("🏁 Migration complete: %d success, %d failed, %d skipped\n", successCount, failCount, skipCount)
	if failCount > 0 {
		os.Exit(1)
	}
}

func markAsMigrated(db *gorm.DB, id string) error {
	return db.Table("what_reverse_workspace_databases").
		Where("id = ?", id).
		Update("status", "migrated").Error
}
