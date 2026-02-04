package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/workspace_db"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	workspaceDBMigrationLockTimeoutSeconds = 10
)

// WorkspaceDBSchemaMigrationPlanItem 迁移计划项
type WorkspaceDBSchemaMigrationPlanItem struct {
	Version        string   `json:"version"`
	StatementCount int      `json:"statement_count"`
	HasDown        bool     `json:"has_down"`
	RiskSignals    []string `json:"risk_signals,omitempty"`
}

// WorkspaceDBSchemaMigrationPlan 迁移计划
type WorkspaceDBSchemaMigrationPlan struct {
	CurrentVersion  string                               `json:"current_version"`
	TargetVersion   string                               `json:"target_version"`
	Pending         []WorkspaceDBSchemaMigrationPlanItem `json:"pending"`
	TotalPending    int                                  `json:"total_pending"`
	TotalStatements int                                  `json:"total_statements"`
}

// WorkspaceDBSchemaMigrationPrecheck 迁移预检结果
type WorkspaceDBSchemaMigrationPrecheck struct {
	Blocked   bool     `json:"blocked"`
	RiskLevel string   `json:"risk_level"`
	Warnings  []string `json:"warnings,omitempty"`
}

// SubmitWorkspaceDBSchemaMigrationRequest 提交迁移审批请求
type SubmitWorkspaceDBSchemaMigrationRequest struct {
	Note      *string `json:"note"`
	VerifySQL *string `json:"verify_sql"`
	Force     bool    `json:"force"`
}

// ApproveWorkspaceDBSchemaMigrationRequest 审批通过请求
type ApproveWorkspaceDBSchemaMigrationRequest struct {
	Note *string `json:"note"`
}

// RejectWorkspaceDBSchemaMigrationRequest 审批拒绝请求
type RejectWorkspaceDBSchemaMigrationRequest struct {
	Reason *string `json:"reason"`
}

var (
	blockedSQLTokens = []string{
		"drop database",
		"drop user",
		"alter user",
		"create user",
		"grant ",
		"revoke ",
	}
	warnSQLTokens = []string{
		"drop table",
		"truncate ",
		"delete from",
	}
)

func (s *workspaceDatabaseService) PreviewDBSchemaMigration(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceDBSchemaMigrationPlan, *WorkspaceDBSchemaMigrationPrecheck, error) {
	if _, err := s.authorizeWorkspaceDBMigration(ctx, workspaceID, ownerID); err != nil {
		return nil, nil, err
	}

	database, password, err := s.resolveWorkspaceDatabase(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, nil, err
	}

	workspaceDB, err := sql.Open("mysql", s.workspaceDSN(database, password))
	if err != nil {
		return nil, nil, ErrWorkspaceDatabaseMigrationFailed
	}
	defer workspaceDB.Close()

	plan, precheck, err := s.buildSchemaMigrationPlan(ctx, workspaceDB)
	if err != nil {
		return nil, nil, err
	}
	if plan.TotalPending == 0 {
		return nil, nil, ErrWorkspaceDBSchemaMigrationNoPending
	}

	return plan, precheck, nil
}

func (s *workspaceDatabaseService) SubmitDBSchemaMigration(ctx context.Context, workspaceID, ownerID uuid.UUID, req SubmitWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error) {
	access, err := s.authorizeWorkspaceDBMigration(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if s.migrationRepo == nil {
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	if err := s.ensureNoActiveMigration(ctx, workspaceID); err != nil {
		return nil, err
	}

	verifySQL := normalizeOptionalString(req.VerifySQL)
	if verifySQL != nil {
		if err := validateVerifySQL(*verifySQL); err != nil {
			return nil, ErrWorkspaceDBSchemaMigrationInvalidVerifySQL
		}
	}

	database, password, err := s.resolveWorkspaceDatabase(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	workspaceDB, err := sql.Open("mysql", s.workspaceDSN(database, password))
	if err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}
	defer workspaceDB.Close()

	plan, precheck, err := s.buildSchemaMigrationPlan(ctx, workspaceDB)
	if err != nil {
		return nil, err
	}
	if plan.TotalPending == 0 {
		return nil, ErrWorkspaceDBSchemaMigrationNoPending
	}
	if precheck.Blocked && !req.Force {
		return nil, ErrWorkspaceDBSchemaMigrationBlocked
	}

	migration := &entity.WorkspaceDBSchemaMigration{
		WorkspaceID:     workspaceID,
		SubmitterID:     ownerID,
		Status:          entity.WorkspaceDBSchemaMigrationStatusPendingReview,
		FromVersion:     optionalString(plan.CurrentVersion),
		TargetVersion:   optionalString(plan.TargetVersion),
		PendingVersions: extractPendingVersions(plan),
		Plan:            planToJSON(plan),
		Precheck:        precheckToJSON(precheck),
		Result:          entity.JSON{},
		VerifySQL:       verifySQL,
	}

	if err := s.migrationRepo.Create(ctx, migration); err != nil {
		return nil, err
	}

	if s.reviewQueueRepo == nil {
		_ = s.migrationRepo.Delete(ctx, migration.ID)
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	reviewQueue := s.buildWorkspaceDBSchemaMigrationReviewQueue(access.Workspace, migration, ownerID, req.Note)
	if err := s.reviewQueueRepo.Create(ctx, reviewQueue); err != nil {
		_ = s.migrationRepo.Delete(ctx, migration.ID)
		return nil, err
	}

	migration.ReviewQueueID = &reviewQueue.ID
	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	return migration, nil
}

func (s *workspaceDatabaseService) GetDBSchemaMigration(ctx context.Context, workspaceID, ownerID, migrationID uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error) {
	if _, err := s.authorizeWorkspaceDBMigration(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}
	if s.migrationRepo == nil {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}
	migration, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDBSchemaMigrationNotFound
		}
		return nil, err
	}
	if migration.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}
	return migration, nil
}

func (s *workspaceDatabaseService) ApproveDBSchemaMigration(ctx context.Context, reviewerUserID, workspaceID, migrationID uuid.UUID, req ApproveWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error) {
	if s.migrationRepo == nil || s.reviewQueueRepo == nil {
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	migration, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDBSchemaMigrationNotFound
		}
		return nil, err
	}
	if migration.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}
	if migration.ReviewQueueID == nil {
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrDBSchemaReviewerNotFound
	}

	note := "审核通过"
	if req.Note != nil && strings.TrimSpace(*req.Note) != "" {
		note = strings.TrimSpace(*req.Note)
	}

	if err := s.reviewQueueRepo.Approve(ctx, *migration.ReviewQueueID, reviewer.ID, note); err != nil {
		return nil, err
	}

	record := &entity.ReviewRecord{
		QueueID:    *migration.ReviewQueueID,
		ReviewerID: reviewer.ID,
		Action:     "approve",
		FromStatus: nil,
		ToStatus:   entity.ReviewStatusApproved,
		Comment:    &note,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)

	reviewer.TotalReviews++
	reviewer.ApprovedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)

	now := time.Now()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusApproved
	migration.ReviewNote = &note
	migration.ApprovedBy = &reviewerUserID
	migration.ApprovedAt = &now

	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	return migration, nil
}

func (s *workspaceDatabaseService) RejectDBSchemaMigration(ctx context.Context, reviewerUserID, workspaceID, migrationID uuid.UUID, req RejectWorkspaceDBSchemaMigrationRequest) (*entity.WorkspaceDBSchemaMigration, error) {
	if s.migrationRepo == nil || s.reviewQueueRepo == nil {
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	migration, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDBSchemaMigrationNotFound
		}
		return nil, err
	}
	if migration.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}
	if migration.ReviewQueueID == nil {
		return nil, ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}

	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, ErrDBSchemaReviewerNotFound
	}

	reason := "审核拒绝"
	if req.Reason != nil && strings.TrimSpace(*req.Reason) != "" {
		reason = strings.TrimSpace(*req.Reason)
	}

	if err := s.reviewQueueRepo.Reject(ctx, *migration.ReviewQueueID, reviewer.ID, reason); err != nil {
		return nil, err
	}

	record := &entity.ReviewRecord{
		QueueID:    *migration.ReviewQueueID,
		ReviewerID: reviewer.ID,
		Action:     "reject",
		FromStatus: nil,
		ToStatus:   entity.ReviewStatusRejected,
		Comment:    &reason,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)

	reviewer.TotalReviews++
	reviewer.RejectedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)

	now := time.Now()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusRejected
	migration.ReviewNote = &reason
	migration.ApprovedAt = &now

	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	return migration, nil
}

func (s *workspaceDatabaseService) ExecuteDBSchemaMigration(ctx context.Context, workspaceID, ownerID, migrationID uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error) {
	if _, err := s.authorizeWorkspaceDBMigration(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}
	if s.migrationRepo == nil {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}

	migration, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDBSchemaMigrationNotFound
		}
		return nil, err
	}
	if migration.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceDBSchemaMigrationNotFound
	}
	if migration.Status != entity.WorkspaceDBSchemaMigrationStatusApproved {
		return nil, ErrWorkspaceDBSchemaMigrationNotApproved
	}

	if err := s.ensureNoActiveMigrationExcept(ctx, workspaceID, migration.ID); err != nil {
		return nil, err
	}

	database, password, err := s.resolveWorkspaceDatabase(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	workspaceDB, err := sql.Open("mysql", s.workspaceDSN(database, password))
	if err != nil {
		return nil, ErrWorkspaceDatabaseMigrationFailed
	}
	defer workspaceDB.Close()

	if err := s.acquireMigrationLock(ctx, workspaceDB, workspaceID); err != nil {
		return nil, err
	}
	defer s.releaseMigrationLock(ctx, workspaceDB, workspaceID)

	plan, precheck, err := s.buildSchemaMigrationPlan(ctx, workspaceDB)
	if err != nil {
		return nil, err
	}
	if plan.TotalPending == 0 {
		return nil, ErrWorkspaceDBSchemaMigrationNoPending
	}
	if precheck.Blocked {
		return nil, ErrWorkspaceDBSchemaMigrationBlocked
	}

	now := time.Now()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusRunning
	migration.StartedAt = &now
	migration.Plan = planToJSON(plan)
	migration.Precheck = precheckToJSON(precheck)
	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	backup, err := s.Backup(ctx, workspaceID, ownerID)
	if err != nil {
		s.failMigration(ctx, migration, ErrWorkspaceDatabaseBackupFailed)
		return nil, ErrWorkspaceDatabaseBackupFailed
	}
	migration.BackupID = &backup.BackupID
	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	result, err := s.runWorkspaceMigrations(ctx, workspaceDB)
	if err != nil {
		return s.rollbackSchemaMigration(ctx, workspaceID, ownerID, migration, err)
	}

	if err := s.verifySchemaMigration(ctx, workspaceDB, migration, plan, result); err != nil {
		return s.rollbackSchemaMigration(ctx, workspaceID, ownerID, migration, err)
	}

	completedAt := time.Now()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusCompleted
	migration.CompletedAt = &completedAt
	migration.Result = entity.JSON{
		"applied":         result.Applied,
		"current_version": result.CurrentVersion,
		"total_applied":   len(result.Applied),
	}
	migration.ErrorMessage = nil
	if err := s.migrationRepo.Update(ctx, migration); err != nil {
		return nil, err
	}

	return migration, nil
}

func (s *workspaceDatabaseService) rollbackSchemaMigration(ctx context.Context, workspaceID, ownerID uuid.UUID, migration *entity.WorkspaceDBSchemaMigration, migrationErr error) (*entity.WorkspaceDBSchemaMigration, error) {
	if migration == nil {
		return nil, migrationErr
	}
	message := migrationErr.Error()
	migration.ErrorMessage = &message

	if migration.BackupID == nil {
		return s.failMigration(ctx, migration, migrationErr)
	}

	if _, err := s.Restore(ctx, workspaceID, ownerID, *migration.BackupID); err != nil {
		restoreMessage := fmt.Sprintf("migration failed: %s; rollback failed: %s", message, err.Error())
		migration.ErrorMessage = &restoreMessage
		migration.Status = entity.WorkspaceDBSchemaMigrationStatusFailed
		_ = s.migrationRepo.Update(ctx, migration)
		return migration, migrationErr
	}

	rolledAt := time.Now()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusRolledBack
	migration.CompletedAt = &rolledAt
	_ = s.migrationRepo.Update(ctx, migration)
	return migration, migrationErr
}

func (s *workspaceDatabaseService) failMigration(ctx context.Context, migration *entity.WorkspaceDBSchemaMigration, err error) (*entity.WorkspaceDBSchemaMigration, error) {
	if migration == nil {
		return nil, err
	}
	message := err.Error()
	migration.Status = entity.WorkspaceDBSchemaMigrationStatusFailed
	migration.ErrorMessage = &message
	now := time.Now()
	migration.CompletedAt = &now
	_ = s.migrationRepo.Update(ctx, migration)
	return migration, err
}

func (s *workspaceDatabaseService) verifySchemaMigration(ctx context.Context, workspaceDB *sql.DB, migration *entity.WorkspaceDBSchemaMigration, plan *WorkspaceDBSchemaMigrationPlan, result *WorkspaceDBMigrationResult) error {
	if migration == nil {
		return ErrWorkspaceDatabaseMigrationFailed
	}
	if plan == nil || result == nil {
		return ErrWorkspaceDatabaseMigrationFailed
	}
	if migration.VerifySQL != nil && strings.TrimSpace(*migration.VerifySQL) != "" {
		return runVerifySQL(ctx, workspaceDB, *migration.VerifySQL)
	}
	if plan.TargetVersion != "" && result.CurrentVersion != plan.TargetVersion {
		return ErrWorkspaceDatabaseMigrationFailed
	}
	return nil
}

func runVerifySQL(ctx context.Context, db *sql.DB, sqlText string) error {
	trimmed := sanitizeVerifySQL(sqlText)
	if trimmed == "" {
		return nil
	}
	if isReadOnlySQL(trimmed) {
		rows, err := db.QueryContext(ctx, trimmed)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			// 只验证可执行性，不消费数据
			break
		}
		return rows.Err()
	}
	_, err := db.ExecContext(ctx, trimmed)
	return err
}

func validateVerifySQL(sqlText string) error {
	trimmed := sanitizeVerifySQL(sqlText)
	if trimmed == "" {
		return nil
	}
	if strings.Contains(trimmed, ";") {
		return ErrWorkspaceDBSchemaMigrationInvalidVerifySQL
	}
	if !isReadOnlySQL(trimmed) {
		return ErrWorkspaceDBSchemaMigrationInvalidVerifySQL
	}
	return nil
}

func isReadOnlySQL(sqlText string) bool {
	lower := strings.ToLower(strings.TrimSpace(sqlText))
	return strings.HasPrefix(lower, "select") ||
		strings.HasPrefix(lower, "show") ||
		strings.HasPrefix(lower, "describe") ||
		strings.HasPrefix(lower, "explain")
}

func sanitizeVerifySQL(sqlText string) string {
	trimmed := strings.TrimSpace(sqlText)
	trimmed = strings.TrimRight(trimmed, ";")
	return strings.TrimSpace(trimmed)
}

func (s *workspaceDatabaseService) authorizeWorkspaceDBMigration(ctx context.Context, workspaceID, ownerID uuid.UUID) (*WorkspaceAccess, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if access.IsOwner || hasAnyPermission(access.Permissions, PermissionWorkspaceAdmin, PermissionWorkspaceDBAccess) {
		return access, nil
	}
	return nil, ErrWorkspaceUnauthorized
}

func (s *workspaceDatabaseService) resolveWorkspaceDatabase(ctx context.Context, workspaceID, ownerID uuid.UUID) (*entity.WorkspaceDatabase, string, error) {
	if _, err := s.authorizeWorkspaceDBMigration(ctx, workspaceID, ownerID); err != nil {
		return nil, "", err
	}

	database, err := s.repo.GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrWorkspaceDatabaseNotFound
		}
		return nil, "", err
	}
	if database.Status != workspaceDBStatusReady {
		return nil, "", ErrWorkspaceDatabaseNotReady
	}
	if strings.TrimSpace(database.DBUser) == "" || strings.TrimSpace(database.DBName) == "" {
		return nil, "", ErrWorkspaceDatabaseNotReady
	}

	password, err := s.decryptSecretRef(database.SecretRef)
	if err != nil {
		return nil, "", ErrWorkspaceDatabaseNotReady
	}
	return database, password, nil
}

func (s *workspaceDatabaseService) buildSchemaMigrationPlan(ctx context.Context, workspaceDB *sql.DB) (*WorkspaceDBSchemaMigrationPlan, *WorkspaceDBSchemaMigrationPrecheck, error) {
	if workspaceDB == nil {
		return nil, nil, ErrWorkspaceDatabaseMigrationFailed
	}
	if _, err := workspaceDB.ExecContext(ctx, workspaceDBMigrationTableSQL); err != nil {
		return nil, nil, ErrWorkspaceDatabaseMigrationFailed
	}
	migrations, err := workspace_db.LoadMigrations()
	if err != nil {
		return nil, nil, ErrWorkspaceDatabaseMigrationFailed
	}
	appliedSet, err := s.fetchAppliedMigrations(ctx, workspaceDB)
	if err != nil {
		return nil, nil, ErrWorkspaceDatabaseMigrationFailed
	}

	plan := &WorkspaceDBSchemaMigrationPlan{
		Pending: []WorkspaceDBSchemaMigrationPlanItem{},
	}
	warningSet := map[string]bool{}
	blocked := false

	for _, migration := range migrations {
		if appliedSet[migration.Version] {
			plan.CurrentVersion = migration.Version
			continue
		}
		if strings.TrimSpace(migration.UpSQL) == "" {
			continue
		}
		statementCount := countSQLStatements(migration.UpSQL)
		riskSignals, isBlocked := scanMigrationRisk(migration.UpSQL)
		if isBlocked {
			blocked = true
		}
		for _, signal := range riskSignals {
			warningSet[signal] = true
		}
		item := WorkspaceDBSchemaMigrationPlanItem{
			Version:        migration.Version,
			StatementCount: statementCount,
			HasDown:        strings.TrimSpace(migration.DownSQL) != "",
			RiskSignals:    riskSignals,
		}
		plan.Pending = append(plan.Pending, item)
		plan.TotalStatements += statementCount
		plan.TargetVersion = migration.Version
	}

	plan.TotalPending = len(plan.Pending)
	precheck := buildPrecheck(warningSet, blocked)
	return plan, precheck, nil
}

func buildPrecheck(warningSet map[string]bool, blocked bool) *WorkspaceDBSchemaMigrationPrecheck {
	warnings := make([]string, 0, len(warningSet))
	for warning := range warningSet {
		warnings = append(warnings, warning)
	}
	riskLevel := "low"
	if len(warnings) > 0 {
		riskLevel = "medium"
	}
	if blocked {
		riskLevel = "high"
	}
	return &WorkspaceDBSchemaMigrationPrecheck{
		Blocked:   blocked,
		RiskLevel: riskLevel,
		Warnings:  warnings,
	}
}

func scanMigrationRisk(sqlText string) ([]string, bool) {
	lower := strings.ToLower(sqlText)
	signals := []string{}
	blocked := false
	for _, token := range blockedSQLTokens {
		if strings.Contains(lower, token) {
			signals = append(signals, fmt.Sprintf("blocked:%s", token))
			blocked = true
		}
	}
	for _, token := range warnSQLTokens {
		if strings.Contains(lower, token) {
			signals = append(signals, fmt.Sprintf("warn:%s", token))
		}
	}
	return signals, blocked
}

func countSQLStatements(sqlText string) int {
	count := 0
	for _, part := range strings.Split(sqlText, ";") {
		if strings.TrimSpace(part) != "" {
			count++
		}
	}
	return count
}

func extractPendingVersions(plan *WorkspaceDBSchemaMigrationPlan) entity.StringArray {
	if plan == nil || len(plan.Pending) == 0 {
		return entity.StringArray{}
	}
	versions := make(entity.StringArray, 0, len(plan.Pending))
	for _, item := range plan.Pending {
		versions = append(versions, item.Version)
	}
	return versions
}

func planToJSON(plan *WorkspaceDBSchemaMigrationPlan) entity.JSON {
	if plan == nil {
		return entity.JSON{}
	}
	return entity.JSON{
		"current_version":  plan.CurrentVersion,
		"target_version":   plan.TargetVersion,
		"pending":          plan.Pending,
		"total_pending":    plan.TotalPending,
		"total_statements": plan.TotalStatements,
	}
}

func precheckToJSON(precheck *WorkspaceDBSchemaMigrationPrecheck) entity.JSON {
	if precheck == nil {
		return entity.JSON{}
	}
	return entity.JSON{
		"blocked":    precheck.Blocked,
		"risk_level": precheck.RiskLevel,
		"warnings":   precheck.Warnings,
	}
}

func (s *workspaceDatabaseService) ensureNoActiveMigration(ctx context.Context, workspaceID uuid.UUID) error {
	if s.migrationRepo == nil {
		return ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}
	active, err := s.migrationRepo.GetActiveByWorkspace(ctx, workspaceID, []entity.WorkspaceDBSchemaMigrationStatus{
		entity.WorkspaceDBSchemaMigrationStatusPendingReview,
		entity.WorkspaceDBSchemaMigrationStatusApproved,
		entity.WorkspaceDBSchemaMigrationStatusRunning,
	})
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if active != nil && active.ID != uuid.Nil {
		return ErrWorkspaceDBSchemaMigrationActive
	}
	return nil
}

func (s *workspaceDatabaseService) ensureNoActiveMigrationExcept(ctx context.Context, workspaceID, migrationID uuid.UUID) error {
	if s.migrationRepo == nil {
		return ErrWorkspaceDBSchemaMigrationReviewUnavailable
	}
	active, err := s.migrationRepo.GetActiveByWorkspace(ctx, workspaceID, []entity.WorkspaceDBSchemaMigrationStatus{
		entity.WorkspaceDBSchemaMigrationStatusPendingReview,
		entity.WorkspaceDBSchemaMigrationStatusApproved,
		entity.WorkspaceDBSchemaMigrationStatusRunning,
	})
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if active != nil && active.ID != uuid.Nil && active.ID != migrationID {
		return ErrWorkspaceDBSchemaMigrationActive
	}
	return nil
}

func (s *workspaceDatabaseService) buildWorkspaceDBSchemaMigrationReviewQueue(workspace *entity.Workspace, migration *entity.WorkspaceDBSchemaMigration, submitterID uuid.UUID, note *string) *entity.ReviewQueue {
	description := "Workspace DB Schema 迁移审批"
	title := "Workspace DB Schema Migration"
	if workspace != nil && strings.TrimSpace(workspace.Name) != "" {
		title = fmt.Sprintf("%s DB Schema Migration", workspace.Name)
	}
	snapshot := entity.JSON{
		"workspace_id":     migration.WorkspaceID,
		"migration_id":     migration.ID,
		"pending_versions": migration.PendingVersions,
		"plan":             migration.Plan,
		"precheck":         migration.Precheck,
	}
	queue := &entity.ReviewQueue{
		ItemType:    entity.ReviewItemTypeDBSchema,
		ItemID:      migration.ID,
		SubmitterID: submitterID,
		Status:      entity.ReviewStatusPending,
		Priority:    entity.ReviewPriorityNormal,
		Title:       title,
		Description: &description,
		Snapshot:    snapshot,
	}
	if note != nil && strings.TrimSpace(*note) != "" {
		queue.SubmissionNote = note
	}
	return queue
}

func (s *workspaceDatabaseService) migrationLockKey(workspaceID uuid.UUID) string {
	return fmt.Sprintf("workspace_db_migration_%s", workspaceID.String())
}

func (s *workspaceDatabaseService) acquireMigrationLock(ctx context.Context, db *sql.DB, workspaceID uuid.UUID) error {
	if db == nil {
		return ErrWorkspaceDatabaseMigrationFailed
	}
	var locked int
	if err := db.QueryRowContext(ctx, "SELECT GET_LOCK(?, ?)", s.migrationLockKey(workspaceID), workspaceDBMigrationLockTimeoutSeconds).Scan(&locked); err != nil {
		return ErrWorkspaceDatabaseMigrationFailed
	}
	if locked != 1 {
		return ErrWorkspaceDatabaseMigrationLocked
	}
	return nil
}

func (s *workspaceDatabaseService) releaseMigrationLock(ctx context.Context, db *sql.DB, workspaceID uuid.UUID) {
	if db == nil {
		return
	}
	_, _ = db.ExecContext(ctx, "SELECT RELEASE_LOCK(?)", s.migrationLockKey(workspaceID))
}

func optionalString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	trimmed := strings.TrimSpace(value)
	return &trimmed
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
