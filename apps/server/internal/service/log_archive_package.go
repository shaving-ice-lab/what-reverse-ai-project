package service

import (
	"archive/zip"
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

const (
	logArchiveManifestVersion = "1.0.0"
)

type logArchiveManifest struct {
	Version     string         `json:"version"`
	ArchiveID   string         `json:"archive_id"`
	WorkspaceID string         `json:"workspace_id"`
	ArchiveType string         `json:"archive_type"`
	RangeStart  string         `json:"range_start"`
	RangeEnd    string         `json:"range_end"`
	CreatedAt   string         `json:"created_at"`
	Files       []string       `json:"files"`
	Counts      map[string]int `json:"counts"`
}

type logArchiveIndex struct {
	RangeStart string                 `json:"range_start"`
	RangeEnd   string                 `json:"range_end"`
	Datasets   []logArchiveDatasetRef `json:"datasets"`
}

type logArchiveDatasetRef struct {
	Dataset string `json:"dataset"`
	File    string `json:"file"`
	Count   int    `json:"count"`
}

func (s *workspaceExportService) writeLogArchivePackage(ctx context.Context, job *entity.WorkspaceExportJob) (string, string, int64, string, error) {
	if job == nil {
		return "", "", 0, "", errors.New("log archive job is nil")
	}
	if job.ArchiveRangeStart == nil || job.ArchiveRangeEnd == nil {
		return "", "", 0, "", errors.New("log archive range is required")
	}
	if s.workspaceRepo == nil {
		return "", "", 0, "", errors.New("workspace repository unavailable")
	}
	if err := s.ensureLogArchiveBasePath(); err != nil {
		return "", "", 0, "", err
	}

	workspace, err := s.workspaceRepo.GetByIDUnscoped(ctx, job.WorkspaceID)
	if err != nil || workspace == nil {
		return "", "", 0, "", ErrWorkspaceNotFound
	}

	start := job.ArchiveRangeStart.UTC()
	end := job.ArchiveRangeEnd.UTC()
	if !end.After(start) {
		return "", "", 0, "", errors.New("log archive range is invalid")
	}

	workspaceName := workspace.Slug
	if workspaceName == "" {
		workspaceName = workspace.Name
	}
	safeName := sanitizeFilename(workspaceName)
	if safeName == "" {
		safeName = "workspace"
	}

	basePath := s.logArchiveBasePath()
	fileName := fmt.Sprintf("%s-%s-%s-%s-%s.zip", safeName, string(job.ExportType), start.Format("20060102"), end.Format("20060102"), job.ID.String())
	finalPath := filepath.Join(basePath, fileName)

	tmpFile, err := os.CreateTemp(basePath, "log-archive-*.zip")
	if err != nil {
		return "", "", 0, "", err
	}
	defer func() {
		_ = tmpFile.Close()
	}()

	zipWriter := zip.NewWriter(tmpFile)
	counts := map[string]int{}
	files := make([]string, 0, 3)
	datasets := make([]logArchiveDatasetRef, 0, 3)

	switch job.ExportType {
	case entity.WorkspaceExportTypeExecutionLogArchive:
		executionFile := "executions.jsonl"
		nodeLogFile := "node_logs.jsonl"
		executionCount, err := s.writeExecutionsJSONL(ctx, zipWriter, executionFile, job.WorkspaceID, start, end)
		if err != nil {
			_ = zipWriter.Close()
			return "", "", 0, "", err
		}
		nodeLogCount, err := s.writeNodeLogsJSONL(ctx, zipWriter, nodeLogFile, job.WorkspaceID, start, end)
		if err != nil {
			_ = zipWriter.Close()
			return "", "", 0, "", err
		}
		counts["executions"] = executionCount
		counts["node_logs"] = nodeLogCount
		files = append(files, executionFile, nodeLogFile)
		datasets = append(datasets,
			logArchiveDatasetRef{Dataset: "executions", File: executionFile, Count: executionCount},
			logArchiveDatasetRef{Dataset: "node_logs", File: nodeLogFile, Count: nodeLogCount},
		)
	case entity.WorkspaceExportTypeAuditLogArchive:
		auditFile := "audit_logs.jsonl"
		auditCount, err := s.writeAuditLogsJSONL(ctx, zipWriter, auditFile, job.WorkspaceID, start, end)
		if err != nil {
			_ = zipWriter.Close()
			return "", "", 0, "", err
		}
		counts["audit_logs"] = auditCount
		files = append(files, auditFile)
		datasets = append(datasets, logArchiveDatasetRef{Dataset: "audit_logs", File: auditFile, Count: auditCount})
	default:
		_ = zipWriter.Close()
		return "", "", 0, "", errors.New("unsupported log archive type")
	}

	manifest := logArchiveManifest{
		Version:     logArchiveManifestVersion,
		ArchiveID:   job.ID.String(),
		WorkspaceID: job.WorkspaceID.String(),
		ArchiveType: string(job.ExportType),
		RangeStart:  start.Format(time.RFC3339),
		RangeEnd:    end.Format(time.RFC3339),
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		Files:       files,
		Counts:      counts,
	}
	if err := writeZipJSON(zipWriter, "manifest.json", manifest); err != nil {
		_ = zipWriter.Close()
		return "", "", 0, "", err
	}
	index := logArchiveIndex{
		RangeStart: manifest.RangeStart,
		RangeEnd:   manifest.RangeEnd,
		Datasets:   datasets,
	}
	if err := writeZipJSON(zipWriter, "index.json", index); err != nil {
		_ = zipWriter.Close()
		return "", "", 0, "", err
	}

	if err := zipWriter.Close(); err != nil {
		return "", "", 0, "", err
	}
	if err := tmpFile.Close(); err != nil {
		return "", "", 0, "", err
	}

	if err := os.Rename(tmpFile.Name(), finalPath); err != nil {
		return "", "", 0, "", err
	}
	stat, err := os.Stat(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	checksum, err := sha256File(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}

	return finalPath, fileName, stat.Size(), checksum, nil
}

func (s *workspaceExportService) writeExecutionsJSONL(ctx context.Context, writer *zip.Writer, name string, workspaceID uuid.UUID, start, end time.Time) (int, error) {
	if s.executionRepo == nil {
		return 0, errors.New("execution repository unavailable")
	}
	file, err := writer.Create(name)
	if err != nil {
		return 0, err
	}
	buf := bufio.NewWriter(file)
	total := 0
	offset := 0
	limit := 200
	for {
		executions, err := s.executionRepo.ListExecutionsByWorkspaceAndCreatedBetween(ctx, workspaceID, start, end, offset, limit)
		if err != nil {
			return total, err
		}
		if len(executions) == 0 {
			break
		}
		for _, execution := range executions {
			data, err := json.Marshal(execution)
			if err != nil {
				return total, err
			}
			if _, err := buf.Write(data); err != nil {
				return total, err
			}
			if err := buf.WriteByte('\n'); err != nil {
				return total, err
			}
			total++
		}
		offset += len(executions)
	}
	if err := buf.Flush(); err != nil {
		return total, err
	}
	return total, nil
}

func (s *workspaceExportService) writeNodeLogsJSONL(ctx context.Context, writer *zip.Writer, name string, workspaceID uuid.UUID, start, end time.Time) (int, error) {
	if s.executionRepo == nil {
		return 0, errors.New("execution repository unavailable")
	}
	file, err := writer.Create(name)
	if err != nil {
		return 0, err
	}
	buf := bufio.NewWriter(file)
	total := 0
	offset := 0
	limit := 200
	for {
		logs, err := s.executionRepo.ListNodeLogsByWorkspaceAndCreatedBetween(ctx, workspaceID, start, end, offset, limit)
		if err != nil {
			return total, err
		}
		if len(logs) == 0 {
			break
		}
		for _, log := range logs {
			data, err := json.Marshal(log)
			if err != nil {
				return total, err
			}
			if _, err := buf.Write(data); err != nil {
				return total, err
			}
			if err := buf.WriteByte('\n'); err != nil {
				return total, err
			}
			total++
		}
		offset += len(logs)
	}
	if err := buf.Flush(); err != nil {
		return total, err
	}
	return total, nil
}

func (s *workspaceExportService) writeAuditLogsJSONL(ctx context.Context, writer *zip.Writer, name string, workspaceID uuid.UUID, start, end time.Time) (int, error) {
	if s.auditLogRepo == nil {
		return 0, errors.New("audit log repository unavailable")
	}
	file, err := writer.Create(name)
	if err != nil {
		return 0, err
	}
	buf := bufio.NewWriter(file)
	total := 0
	offset := 0
	limit := 200
	for {
		logs, err := s.auditLogRepo.ListAuditLogsByWorkspaceAndCreatedBetween(ctx, workspaceID, start, end, offset, limit)
		if err != nil {
			return total, err
		}
		if len(logs) == 0 {
			break
		}
		for _, log := range logs {
			data, err := json.Marshal(log)
			if err != nil {
				return total, err
			}
			if _, err := buf.Write(data); err != nil {
				return total, err
			}
			if err := buf.WriteByte('\n'); err != nil {
				return total, err
			}
			total++
		}
		offset += len(logs)
	}
	if err := buf.Flush(); err != nil {
		return total, err
	}
	return total, nil
}

func (s *workspaceExportService) cleanupArchivedLogs(ctx context.Context, job *entity.WorkspaceExportJob) error {
	if job == nil || job.ArchiveRangeStart == nil || job.ArchiveRangeEnd == nil {
		return nil
	}
	switch job.ExportType {
	case entity.WorkspaceExportTypeExecutionLogArchive:
		if s.executionRepo == nil {
			return errors.New("execution repository unavailable")
		}
		_, err := s.executionRepo.DeleteNodeLogsByWorkspaceAndCreatedBetween(ctx, job.WorkspaceID, *job.ArchiveRangeStart, *job.ArchiveRangeEnd)
		return err
	case entity.WorkspaceExportTypeAuditLogArchive:
		if s.auditLogRepo == nil {
			return errors.New("audit log repository unavailable")
		}
		_, err := s.auditLogRepo.DeleteByWorkspaceAndCreatedBetween(ctx, job.WorkspaceID, *job.ArchiveRangeStart, *job.ArchiveRangeEnd)
		return err
	default:
		return nil
	}
}

func (s *workspaceExportService) logArchiveBasePath() string {
	basePath := strings.TrimSpace(s.cfg.BasePath)
	if basePath == "" {
		basePath = "./data/exports"
	}
	return filepath.Join(basePath, "log-archives")
}

func (s *workspaceExportService) ensureLogArchiveBasePath() error {
	return os.MkdirAll(s.logArchiveBasePath(), 0o755)
}
