package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// SupplyChainService 供应链安全服务接口
type SupplyChainService interface {
	GetLicensePolicy() security.LicensePolicy
	ReviewLicenses(deps []security.LicenseDependency) (security.LicenseReviewResult, error)

	CreateSBOM(ctx context.Context, input CreateSBOMInput) (*entity.SBOMRecord, error)
	ListSBOMs(ctx context.Context, filter repository.SBOMFilter, page, pageSize int) ([]entity.SBOMRecord, int64, error)
	GetLatestSBOM(ctx context.Context, filter repository.SBOMFilter) (*entity.SBOMRecord, error)

	CreateSignature(ctx context.Context, input CreateSignatureInput) (*entity.ArtifactSignature, error)
	ListSignatures(ctx context.Context, filter repository.SignatureFilter, page, pageSize int) ([]entity.ArtifactSignature, int64, error)
	GetLatestSignature(ctx context.Context, filter repository.SignatureFilter) (*entity.ArtifactSignature, error)
}

// CreateSBOMInput 创建 SBOM 输入
type CreateSBOMInput struct {
	WorkspaceID  uuid.UUID
	ArtifactType string
	ArtifactID   string
	Format       string
	Version      *string
	Source       *string
	Digest       *string
	Content      entity.JSON
	Metadata     entity.JSON
	GeneratedAt  *time.Time
	CreatedBy    *uuid.UUID
}

// CreateSignatureInput 创建签名输入
type CreateSignatureInput struct {
	WorkspaceID  uuid.UUID
	ArtifactType string
	ArtifactID   string
	Digest       string
	Algorithm    string
	Signature    string
	Signer       *string
	Certificate  *string
	Source       *string
	Verified     *bool
	VerifiedAt   *time.Time
	Metadata     entity.JSON
	CreatedBy    *uuid.UUID
}

// 错误定义
var (
	ErrLicenseReviewDisabled = errors.New("license review is disabled")
	ErrSBOMDisabled          = errors.New("sbom archive is disabled")
	ErrSigningDisabled       = errors.New("artifact signing is disabled")
	ErrInvalidSBOM           = errors.New("invalid sbom content")
	ErrInvalidSignature      = errors.New("invalid signature input")
)

type supplyChainService struct {
	cfg  *config.Config
	repo repository.SupplyChainRepository
}

// NewSupplyChainService 创建供应链安全服务
func NewSupplyChainService(cfg *config.Config, repo repository.SupplyChainRepository) SupplyChainService {
	return &supplyChainService{
		cfg:  cfg,
		repo: repo,
	}
}

func (s *supplyChainService) GetLicensePolicy() security.LicensePolicy {
	licenseCfg := s.cfg.Security.SupplyChain.License
	policy := security.LicensePolicy{
		Key:           "dependency_license_policy",
		Title:         "依赖许可审查规则",
		Version:       "v1",
		Allowed:       append([]string{}, licenseCfg.Allowed...),
		Review:        append([]string{}, licenseCfg.Review...),
		Denied:        append([]string{}, licenseCfg.Denied...),
		DefaultAction: licenseCfg.DefaultAction,
		Notes: []string{
			"默认策略由配置 security.supply_chain.license 决定。",
			"未命中规则时按 default_action 处理。",
		},
	}
	if policy.DefaultAction == "" {
		policy.DefaultAction = "review"
	}
	return policy
}

func (s *supplyChainService) ReviewLicenses(deps []security.LicenseDependency) (security.LicenseReviewResult, error) {
	if !s.cfg.Security.SupplyChain.License.Enabled {
		return security.LicenseReviewResult{}, ErrLicenseReviewDisabled
	}
	policy := s.GetLicensePolicy()
	return security.EvaluateLicenseCompliance(policy, deps), nil
}

func (s *supplyChainService) CreateSBOM(ctx context.Context, input CreateSBOMInput) (*entity.SBOMRecord, error) {
	if !s.cfg.Security.SupplyChain.SBOM.Enabled {
		return nil, ErrSBOMDisabled
	}
	if input.Content == nil {
		return nil, ErrInvalidSBOM
	}
	if input.ArtifactType == "" || input.ArtifactID == "" {
		return nil, ErrInvalidSBOM
	}
	if input.Format == "" {
		input.Format = "spdx-json"
	}
	allowedFormats := normalizeList(s.cfg.Security.SupplyChain.SBOM.Formats)
	if len(allowedFormats) > 0 && !containsString(allowedFormats, strings.ToLower(input.Format)) {
		return nil, ErrInvalidSBOM
	}
	if input.GeneratedAt == nil {
		now := time.Now()
		input.GeneratedAt = &now
	}
	if input.Digest == nil || strings.TrimSpace(*input.Digest) == "" {
		digest, err := hashJSONContent(input.Content)
		if err != nil {
			return nil, err
		}
		input.Digest = &digest
	}

	record := &entity.SBOMRecord{
		WorkspaceID:  input.WorkspaceID,
		ArtifactType: input.ArtifactType,
		ArtifactID:   input.ArtifactID,
		Format:       input.Format,
		Version:      input.Version,
		Source:       input.Source,
		Digest:       input.Digest,
		Content:      input.Content,
		Metadata:     input.Metadata,
		GeneratedAt:  input.GeneratedAt,
		CreatedBy:    input.CreatedBy,
		CreatedAt:    time.Now(),
	}
	if err := s.repo.CreateSBOM(ctx, record); err != nil {
		return nil, err
	}
	return record, nil
}

func (s *supplyChainService) ListSBOMs(ctx context.Context, filter repository.SBOMFilter, page, pageSize int) ([]entity.SBOMRecord, int64, error) {
	if !s.cfg.Security.SupplyChain.SBOM.Enabled {
		return nil, 0, ErrSBOMDisabled
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.repo.ListSBOMs(ctx, filter, offset, pageSize)
}

func (s *supplyChainService) GetLatestSBOM(ctx context.Context, filter repository.SBOMFilter) (*entity.SBOMRecord, error) {
	if !s.cfg.Security.SupplyChain.SBOM.Enabled {
		return nil, ErrSBOMDisabled
	}
	return s.repo.GetLatestSBOM(ctx, filter)
}

func (s *supplyChainService) CreateSignature(ctx context.Context, input CreateSignatureInput) (*entity.ArtifactSignature, error) {
	if !s.cfg.Security.SupplyChain.Signing.Required && !s.cfg.Security.SupplyChain.Signing.VerifyOnUpload {
		return nil, ErrSigningDisabled
	}
	if input.ArtifactType == "" || input.ArtifactID == "" || input.Digest == "" || input.Algorithm == "" || input.Signature == "" {
		return nil, ErrInvalidSignature
	}

	verified := false
	metadata := input.Metadata
	if s.cfg.Security.SupplyChain.Signing.VerifyOnUpload {
		verified, metadata = s.verifySignaturePolicy(input)
	} else if input.Verified != nil {
		verified = *input.Verified
	}

	var verifiedAt *time.Time
	if verified {
		if input.VerifiedAt != nil {
			verifiedAt = input.VerifiedAt
		} else {
			now := time.Now()
			verifiedAt = &now
		}
	}

	record := &entity.ArtifactSignature{
		WorkspaceID:          input.WorkspaceID,
		ArtifactType:         input.ArtifactType,
		ArtifactID:           input.ArtifactID,
		Digest:               input.Digest,
		Algorithm:            input.Algorithm,
		Signature:            input.Signature,
		Signer:               input.Signer,
		Certificate:          input.Certificate,
		Verified:             verified,
		VerifiedAt:           verifiedAt,
		VerificationMetadata: metadata,
		Source:               input.Source,
		CreatedBy:            input.CreatedBy,
		CreatedAt:            time.Now(),
	}

	if err := s.repo.CreateSignature(ctx, record); err != nil {
		return nil, err
	}
	return record, nil
}

func (s *supplyChainService) ListSignatures(ctx context.Context, filter repository.SignatureFilter, page, pageSize int) ([]entity.ArtifactSignature, int64, error) {
	if !s.cfg.Security.SupplyChain.Signing.Required && !s.cfg.Security.SupplyChain.Signing.VerifyOnUpload {
		return nil, 0, ErrSigningDisabled
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.repo.ListSignatures(ctx, filter, offset, pageSize)
}

func (s *supplyChainService) GetLatestSignature(ctx context.Context, filter repository.SignatureFilter) (*entity.ArtifactSignature, error) {
	if !s.cfg.Security.SupplyChain.Signing.Required && !s.cfg.Security.SupplyChain.Signing.VerifyOnUpload {
		return nil, ErrSigningDisabled
	}
	return s.repo.GetLatestSignature(ctx, filter)
}

func (s *supplyChainService) verifySignaturePolicy(input CreateSignatureInput) (bool, entity.JSON) {
	signing := s.cfg.Security.SupplyChain.Signing
	allowedAlgorithms := normalizeList(signing.AllowedAlgorithms)
	allowedSigners := normalizeList(signing.AllowedSigners)

	reasons := []string{}
	if len(allowedAlgorithms) > 0 && !containsString(allowedAlgorithms, strings.ToLower(input.Algorithm)) {
		reasons = append(reasons, "算法不在允许清单")
	}
	if len(allowedSigners) > 0 && input.Signer == nil {
		reasons = append(reasons, "签名者缺失")
	}
	if input.Signer != nil && len(allowedSigners) > 0 && !containsString(allowedSigners, strings.ToLower(*input.Signer)) {
		reasons = append(reasons, "签名者不在允许清单")
	}
	if input.Signature == "" {
		reasons = append(reasons, "签名为空")
	}
	if input.Digest == "" {
		reasons = append(reasons, "摘要为空")
	}

	verified := len(reasons) == 0
	meta := entity.JSON{
		"verification_mode":  "policy",
		"allowed_algorithms": signing.AllowedAlgorithms,
		"allowed_signers":    signing.AllowedSigners,
		"reasons":            reasons,
	}
	if input.Metadata != nil {
		meta["external"] = input.Metadata
	}
	return verified, meta
}

func normalizeList(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		out = append(out, strings.ToLower(trimmed))
	}
	return out
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func hashJSONContent(content entity.JSON) (string, error) {
	data, err := json.Marshal(content)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:]), nil
}
