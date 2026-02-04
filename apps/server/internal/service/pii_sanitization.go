package service

import (
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/security"
)

type piiSanitizer struct {
	enabled   bool
	sanitizer *security.PIISanitizer
}

func newPIISanitizer(enabled bool) *piiSanitizer {
	if !enabled {
		return &piiSanitizer{enabled: false}
	}
	return &piiSanitizer{
		enabled:   true,
		sanitizer: security.NewPIISanitizer(),
	}
}

func (p *piiSanitizer) sanitizeJSON(value entity.JSON) entity.JSON {
	if p == nil || !p.enabled || p.sanitizer == nil || value == nil {
		return value
	}
	sanitized := p.sanitizer.SanitizeMap(map[string]interface{}(value))
	return entity.JSON(sanitized)
}

func (p *piiSanitizer) sanitizeString(value string) string {
	if p == nil || !p.enabled || p.sanitizer == nil || value == "" {
		return value
	}
	return p.sanitizer.SanitizeString(value)
}

func (p *piiSanitizer) sanitizeMap(value map[string]interface{}) map[string]interface{} {
	if p == nil || !p.enabled || p.sanitizer == nil || value == nil {
		return value
	}
	return p.sanitizer.SanitizeMap(value)
}
