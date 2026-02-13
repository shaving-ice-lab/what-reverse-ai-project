package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

// RuntimeVMHandler handles /runtime/:slug/api/* requests via the VM engine.
type RuntimeVMHandler struct {
	runtimeService     service.RuntimeService
	vmPool             *vmruntime.VMPool
	runtimeAuthService service.RuntimeAuthService
}

// NewRuntimeVMHandler creates a new RuntimeVMHandler.
func NewRuntimeVMHandler(
	runtimeService service.RuntimeService,
	vmPool *vmruntime.VMPool,
	runtimeAuthService service.RuntimeAuthService,
) *RuntimeVMHandler {
	return &RuntimeVMHandler{
		runtimeService:     runtimeService,
		vmPool:             vmPool,
		runtimeAuthService: runtimeAuthService,
	}
}

// HandleAPI is the catch-all handler for /runtime/:slug/api/*
func (h *RuntimeVMHandler) HandleAPI(c echo.Context) error {
	slug := c.Param("workspaceSlug")
	if strings.TrimSpace(slug) == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "workspace slug is required",
		})
	}

	entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
	if err != nil || entry == nil || entry.Workspace == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "workspace not found or not published",
		})
	}

	workspaceID := entry.Workspace.ID.String()

	vm, err := h.vmPool.GetOrCreate(c.Request().Context(), workspaceID)
	if err != nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
			"error": "VM not available: " + err.Error(),
		})
	}

	// Extract the API path from the wildcard
	apiPath := c.Param("*")
	if !strings.HasPrefix(apiPath, "/") {
		apiPath = "/" + apiPath
	}

	// Build VMRequest
	req := h.buildVMRequest(c, apiPath)

	// Execute in VM
	resp, err := vm.Handle(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	status := resp.Status
	if status == 0 {
		status = http.StatusOK
	}
	return c.JSON(status, resp.Body)
}

// buildVMRequest extracts request parameters and builds a VMRequest.
func (h *RuntimeVMHandler) buildVMRequest(c echo.Context, apiPath string) vmruntime.VMRequest {
	req := vmruntime.VMRequest{
		Method:  c.Request().Method,
		Path:    apiPath,
		Params:  make(map[string]string),
		Query:   make(map[string]string),
		Headers: make(map[string]string),
	}

	// Query parameters
	for key, values := range c.QueryParams() {
		if len(values) > 0 {
			req.Query[key] = values[0]
		}
	}

	// Headers (selected safe headers only)
	safeHeaders := []string{
		"Content-Type", "Accept", "Authorization",
		"X-App-Token", "X-Request-ID", "Origin", "Referer",
	}
	for _, h := range safeHeaders {
		if v := c.Request().Header.Get(h); v != "" {
			req.Headers[strings.ToLower(h)] = v
		}
	}

	// Body (for POST/PUT/PATCH)
	if c.Request().Method == "POST" || c.Request().Method == "PUT" || c.Request().Method == "PATCH" {
		req.Body = h.parseBody(c)
	}

	// Resolve app user from X-App-Token
	req.User = h.resolveUser(c)

	return req
}

// parseBody reads and parses the request body as JSON.
func (h *RuntimeVMHandler) parseBody(c echo.Context) map[string]interface{} {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil || len(body) == 0 {
		return nil
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil
	}
	return data
}

// resolveUser extracts the app user from X-App-Token header.
func (h *RuntimeVMHandler) resolveUser(c echo.Context) *vmruntime.VMUser {
	token := c.Request().Header.Get("X-App-Token")
	if token == "" || h.runtimeAuthService == nil {
		return nil
	}

	user, err := h.runtimeAuthService.ValidateSession(c.Request().Context(), token)
	if err != nil || user == nil {
		return nil
	}

	name := ""
	if user.DisplayName != nil {
		name = *user.DisplayName
	}
	return &vmruntime.VMUser{
		ID:    user.ID.String(),
		Email: user.Email,
		Name:  name,
	}
}
