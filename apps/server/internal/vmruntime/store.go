package vmruntime

import (
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"

	_ "modernc.org/sqlite"
)

// VMStore manages per-workspace SQLite database connections.
type VMStore struct {
	mu      sync.RWMutex
	baseDir string
	dbs     map[string]*sql.DB
}

// NewVMStore creates a new VMStore with the given base directory for SQLite files.
func NewVMStore(baseDir string) *VMStore {
	return &VMStore{
		baseDir: baseDir,
		dbs:     make(map[string]*sql.DB),
	}
}

// GetDB returns the SQLite *sql.DB for a workspace, creating the file if needed.
func (s *VMStore) GetDB(workspaceID string) (*sql.DB, error) {
	s.mu.RLock()
	if db, ok := s.dbs[workspaceID]; ok {
		s.mu.RUnlock()
		return db, nil
	}
	s.mu.RUnlock()

	s.mu.Lock()
	defer s.mu.Unlock()

	if db, ok := s.dbs[workspaceID]; ok {
		return db, nil
	}

	dbPath := s.DBPath(workspaceID)
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("vmstore: failed to create directory: %w", err)
	}

	dsn := fmt.Sprintf("file:%s?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("vmstore: failed to open sqlite: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := configurePragmas(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("vmstore: failed to configure pragmas: %w", err)
	}

	s.dbs[workspaceID] = db
	return db, nil
}

// configurePragmas sets SQLite PRAGMA options for performance and safety.
func configurePragmas(db *sql.DB) error {
	pragmas := []string{
		"PRAGMA journal_mode = WAL",
		"PRAGMA busy_timeout = 5000",
		"PRAGMA foreign_keys = ON",
		"PRAGMA synchronous = NORMAL",
		"PRAGMA cache_size = -2000",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			return fmt.Errorf("pragma %q: %w", p, err)
		}
	}
	return nil
}

// Close closes all cached database connections.
func (s *VMStore) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, db := range s.dbs {
		db.Close()
		delete(s.dbs, id)
	}
}

// CloseDB closes a specific workspace's database connection.
func (s *VMStore) CloseDB(workspaceID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if db, ok := s.dbs[workspaceID]; ok {
		err := db.Close()
		delete(s.dbs, workspaceID)
		return err
	}
	return nil
}

// Exists checks whether a SQLite file exists for the given workspace.
func (s *VMStore) Exists(workspaceID string) bool {
	_, err := os.Stat(s.DBPath(workspaceID))
	return err == nil
}

// Delete closes the connection and removes the SQLite file for a workspace.
func (s *VMStore) Delete(workspaceID string) error {
	if err := s.CloseDB(workspaceID); err != nil {
		return fmt.Errorf("vmstore: close before delete: %w", err)
	}
	dbPath := s.DBPath(workspaceID)
	for _, suffix := range []string{"", "-wal", "-shm"} {
		os.Remove(dbPath + suffix)
	}
	return nil
}

// DBPath returns the file path for a workspace's SQLite database.
func (s *VMStore) DBPath(workspaceID string) string {
	return filepath.Join(s.baseDir, workspaceID+".db")
}

// BackupTo copies the SQLite database file to the destination path.
func (s *VMStore) BackupTo(workspaceID, destPath string) error {
	srcPath := s.DBPath(workspaceID)

	db, err := s.GetDB(workspaceID)
	if err != nil {
		return fmt.Errorf("vmstore: backup get db: %w", err)
	}
	if _, err := db.Exec("PRAGMA wal_checkpoint(TRUNCATE)"); err != nil {
		return fmt.Errorf("vmstore: wal checkpoint: %w", err)
	}

	src, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("vmstore: open source: %w", err)
	}
	defer src.Close()

	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return fmt.Errorf("vmstore: create dest dir: %w", err)
	}
	dst, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("vmstore: create dest: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return fmt.Errorf("vmstore: copy file: %w", err)
	}
	return nil
}
