package service

import (
	"net"
	"strings"
)

func safeToken(token *string) string {
	if token == nil {
		return ""
	}
	return strings.TrimSpace(*token)
}

func normalizeHost(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	if strings.Contains(trimmed, ",") {
		trimmed = strings.TrimSpace(strings.Split(trimmed, ",")[0])
	}
	if host, _, err := net.SplitHostPort(trimmed); err == nil {
		trimmed = host
	}
	return strings.TrimSuffix(trimmed, ".")
}
