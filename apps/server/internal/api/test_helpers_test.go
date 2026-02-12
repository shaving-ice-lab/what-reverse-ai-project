package api_test

import (
	"os"
	"strings"
	"testing"
)

type TestConfig struct {
	ServerBaseURL      string
	APIBaseURL         string
	RuntimeBaseURL     string
	Token              string
	WorkspaceID        string
	WorkspaceSlug      string
	WorkspaceVersionID string
	WorkspaceDomain    string
	WorkspaceDomainID  string
	MemberUserID       string
	CaptchaToken       string
	BackupID           string
}

func loadTestConfig() TestConfig {
	serverBase := strings.TrimRight(getEnv("TEST_SERVER_BASE_URL", "http://localhost:3010"), "/")
	apiBaseDefault := serverBase + "/api/v1"
	runtimeBaseDefault := serverBase + "/runtime"

	return TestConfig{
		ServerBaseURL:      serverBase,
		APIBaseURL:         getEnv("TEST_API_BASE_URL", apiBaseDefault),
		RuntimeBaseURL:     getEnv("TEST_RUNTIME_BASE_URL", runtimeBaseDefault),
		Token:              os.Getenv("TEST_JWT_TOKEN"),
		WorkspaceID:        os.Getenv("TEST_WORKSPACE_ID"),
		WorkspaceSlug:      os.Getenv("TEST_WORKSPACE_SLUG"),
		WorkspaceVersionID: os.Getenv("TEST_WORKSPACE_VERSION_ID"),
		WorkspaceDomain:    os.Getenv("TEST_WORKSPACE_DOMAIN"),
		WorkspaceDomainID:  os.Getenv("TEST_WORKSPACE_DOMAIN_ID"),
		MemberUserID:       os.Getenv("TEST_MEMBER_USER_ID"),
		CaptchaToken:       os.Getenv("TEST_CAPTCHA_TOKEN"),
		BackupID:           os.Getenv("TEST_BACKUP_ID"),
	}
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func requireValue(t *testing.T, value, name string) {
	t.Helper()
	if strings.TrimSpace(value) == "" {
		t.Skipf("%s is required", name)
	}
}
