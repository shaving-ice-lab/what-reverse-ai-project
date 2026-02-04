package service

import (
	"sync"

	"github.com/agentflow/server/internal/config"
)

// FeatureFlagsPatch 功能开关更新请求
type FeatureFlagsPatch struct {
	WorkspaceEnabled  *bool
	AppRuntimeEnabled *bool
	DomainEnabled     *bool
}

// FeatureFlagsService 功能开关服务
type FeatureFlagsService interface {
	Get() config.FeatureFlagsConfig
	Update(patch FeatureFlagsPatch) config.FeatureFlagsConfig
	IsWorkspaceEnabled() bool
	IsAppRuntimeEnabled() bool
	IsDomainEnabled() bool
}

type featureFlagsService struct {
	mu    sync.RWMutex
	flags config.FeatureFlagsConfig
}

// NewFeatureFlagsService 创建功能开关服务
func NewFeatureFlagsService(flags config.FeatureFlagsConfig) FeatureFlagsService {
	return &featureFlagsService{flags: flags}
}

func (s *featureFlagsService) Get() config.FeatureFlagsConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.flags
}

func (s *featureFlagsService) Update(patch FeatureFlagsPatch) config.FeatureFlagsConfig {
	s.mu.Lock()
	defer s.mu.Unlock()

	if patch.WorkspaceEnabled != nil {
		s.flags.WorkspaceEnabled = *patch.WorkspaceEnabled
	}
	if patch.AppRuntimeEnabled != nil {
		s.flags.AppRuntimeEnabled = *patch.AppRuntimeEnabled
	}
	if patch.DomainEnabled != nil {
		s.flags.DomainEnabled = *patch.DomainEnabled
	}
	return s.flags
}

func (s *featureFlagsService) IsWorkspaceEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.flags.WorkspaceEnabled
}

func (s *featureFlagsService) IsAppRuntimeEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.flags.AppRuntimeEnabled
}

func (s *featureFlagsService) IsDomainEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.flags.DomainEnabled
}
