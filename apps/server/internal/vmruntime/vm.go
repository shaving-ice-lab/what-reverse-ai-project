package vmruntime

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/dop251/goja"
)

// VMRequest represents the request context passed to JS route handlers.
type VMRequest struct {
	Method  string                 `json:"method"`
	Path    string                 `json:"path"`
	Params  map[string]string      `json:"params"`
	Query   map[string]string      `json:"query"`
	Body    map[string]interface{} `json:"body"`
	Headers map[string]string      `json:"headers"`
	User    *VMUser                `json:"user"`
}

// VMUser represents an authenticated app user in the VM context.
type VMUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// VMResponse represents the response from a JS route handler.
type VMResponse struct {
	Status int         `json:"status"`
	Body   interface{} `json:"body"`
}

// WorkspaceVM holds a goja JS runtime with loaded routes for a workspace.
type WorkspaceVM struct {
	workspaceID string
	runtime     *goja.Runtime
	routes      map[string]goja.Callable // "GET /tasks" → JS function
	codeHash    string
	loadedAt    time.Time
}

// NewWorkspaceVM creates a new VM, sets up the sandbox, injects APIs, and executes the code.
func NewWorkspaceVM(workspaceID string, code string, db *sql.DB) (*WorkspaceVM, error) {
	if err := validateCodeSize(code); err != nil {
		return nil, fmt.Errorf("vm: %w", err)
	}

	vm := goja.New()

	setupSandbox(vm)
	injectConsoleAPI(vm, workspaceID)
	injectDBAPI(vm, db)

	// Create exports object
	vm.Set("exports", vm.NewObject())

	// Execute the user code with timeout
	var execErr error
	if err := withTimeout(vm, VMLoadTimeout, func() error {
		_, execErr = vm.RunString(code)
		return execErr
	}); err != nil {
		return nil, fmt.Errorf("vm: code execution failed: %w", err)
	}

	routes, err := extractRoutes(vm)
	if err != nil {
		return nil, fmt.Errorf("vm: %w", err)
	}

	h := sha256.Sum256([]byte(code))
	return &WorkspaceVM{
		workspaceID: workspaceID,
		runtime:     vm,
		routes:      routes,
		codeHash:    fmt.Sprintf("%x", h[:]),
		loadedAt:    time.Now(),
	}, nil
}

// extractRoutes reads exports.routes from the VM and extracts callable route handlers.
func extractRoutes(vm *goja.Runtime) (map[string]goja.Callable, error) {
	exportsVal := vm.Get("exports")
	if exportsVal == nil || goja.IsUndefined(exportsVal) || goja.IsNull(exportsVal) {
		return map[string]goja.Callable{}, nil
	}

	exportsObj := exportsVal.ToObject(vm)
	routesVal := exportsObj.Get("routes")
	if routesVal == nil || goja.IsUndefined(routesVal) || goja.IsNull(routesVal) {
		return map[string]goja.Callable{}, nil
	}

	routesObj := routesVal.ToObject(vm)
	keys := routesObj.Keys()
	routes := make(map[string]goja.Callable, len(keys))

	for _, key := range keys {
		val := routesObj.Get(key)
		fn, ok := goja.AssertFunction(val)
		if !ok {
			continue
		}
		routes[key] = fn
	}
	return routes, nil
}

// Handle processes an HTTP request by matching it to a route and executing the JS handler.
func (w *WorkspaceVM) Handle(req VMRequest) (*VMResponse, error) {
	routeKey, params := w.matchRoute(req.Method, req.Path)
	if routeKey == "" {
		return &VMResponse{Status: 404, Body: map[string]interface{}{
			"error": fmt.Sprintf("no route matches %s %s", req.Method, req.Path),
		}}, nil
	}

	fn := w.routes[routeKey]

	// Merge matched path params into request params
	if req.Params == nil {
		req.Params = make(map[string]string)
	}
	for k, v := range params {
		req.Params[k] = v
	}

	var result goja.Value
	err := withTimeout(w.runtime, VMExecTimeout, func() error {
		ctxVal := w.runtime.ToValue(map[string]interface{}{
			"method":  req.Method,
			"path":    req.Path,
			"params":  req.Params,
			"query":   req.Query,
			"body":    req.Body,
			"headers": req.Headers,
			"user":    req.User,
		})
		var callErr error
		result, callErr = fn(goja.Undefined(), ctxVal)
		return callErr
	})

	if err != nil {
		return nil, fmt.Errorf("vm handler error: %w", err)
	}

	if result == nil || goja.IsUndefined(result) || goja.IsNull(result) {
		return &VMResponse{Status: 200, Body: nil}, nil
	}

	exported := result.Export()

	// Check if result is a VMResponse-like object with status and body
	if m, ok := exported.(map[string]interface{}); ok {
		if status, exists := m["status"]; exists {
			if statusInt, ok := toInt(status); ok {
				body := m["body"]
				if body == nil {
					body = m
					delete(body.(map[string]interface{}), "status")
				}
				return &VMResponse{Status: statusInt, Body: body}, nil
			}
		}
	}

	return &VMResponse{Status: 200, Body: exported}, nil
}

// Routes returns the list of registered route keys (e.g., "GET /tasks").
func (w *WorkspaceVM) Routes() []string {
	keys := make([]string, 0, len(w.routes))
	for k := range w.routes {
		keys = append(keys, k)
	}
	return keys
}

// CodeHash returns the SHA-256 hash of the loaded code.
func (w *WorkspaceVM) CodeHash() string {
	return w.codeHash
}

// matchRoute finds the best matching route for the given method and path.
// Returns the route key and extracted path parameters.
// Priority: exact match > parameterized match.
func (w *WorkspaceVM) matchRoute(method, path string) (string, map[string]string) {
	method = strings.ToUpper(method)
	path = normalizePath(path)

	// Try exact match first
	exactKey := method + " " + path
	if _, ok := w.routes[exactKey]; ok {
		return exactKey, nil
	}

	// Try parameterized routes
	for routeKey := range w.routes {
		parts := strings.SplitN(routeKey, " ", 2)
		if len(parts) != 2 {
			continue
		}
		routeMethod := strings.ToUpper(parts[0])
		routePattern := parts[1]

		if routeMethod != method {
			continue
		}

		params, matched := matchPath(routePattern, path)
		if matched {
			return routeKey, params
		}
	}

	return "", nil
}

// matchPath matches a route pattern (e.g., "/tasks/:id") against an actual path.
// Returns extracted parameters and whether the match succeeded.
func matchPath(pattern, path string) (map[string]string, bool) {
	patternParts := strings.Split(strings.Trim(pattern, "/"), "/")
	pathParts := strings.Split(strings.Trim(path, "/"), "/")

	if len(patternParts) != len(pathParts) {
		return nil, false
	}

	params := make(map[string]string)
	for i, pp := range patternParts {
		if strings.HasPrefix(pp, ":") {
			params[pp[1:]] = pathParts[i]
		} else if pp != pathParts[i] {
			return nil, false
		}
	}
	return params, true
}

// normalizePath ensures the path starts with / and has no trailing slash.
func normalizePath(path string) string {
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	if len(path) > 1 && strings.HasSuffix(path, "/") {
		path = path[:len(path)-1]
	}
	return path
}

// toInt attempts to convert a value to int.
func toInt(v interface{}) (int, bool) {
	switch n := v.(type) {
	case int:
		return n, true
	case int64:
		return int(n), true
	case float64:
		return int(n), true
	default:
		return 0, false
	}
}
