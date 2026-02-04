package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func newRuntimeTestContext(host string, headers map[string]string) echo.Context {
	req := httptest.NewRequest(http.MethodGet, "http://"+host+"/runtime", nil)
	req.Host = host
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	rec := httptest.NewRecorder()
	return echo.New().NewContext(req, rec)
}

func TestGetDomainHost(t *testing.T) {
	handler := &RuntimeHandler{}
	cases := []struct {
		name    string
		host    string
		headers map[string]string
		want    string
	}{
		{
			name: "x-forwarded-host-priority",
			host: "platform.local:8080",
			headers: map[string]string{
				"X-Forwarded-Host": "Tenant.Example.com:443, proxy.example.com",
				"Forwarded":        `for=192.0.2.43;host="forwarded.example.com";proto=https`,
			},
			want: "tenant.example.com",
		},
		{
			name: "forwarded-host-fallback",
			host: "platform.local:8080",
			headers: map[string]string{
				"Forwarded": `for=192.0.2.43;host="Custom.Example.com:443";proto=https`,
			},
			want: "custom.example.com",
		},
		{
			name: "request-host-fallback",
			host: "Workspace.Example.com:8443",
			want: "workspace.example.com",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := newRuntimeTestContext(tc.host, tc.headers)
			got := handler.getDomainHost(ctx)
			if got != tc.want {
				t.Fatalf("expected host %q, got %q", tc.want, got)
			}
		})
	}
}
