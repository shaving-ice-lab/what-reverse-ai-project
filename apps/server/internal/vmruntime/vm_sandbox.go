package vmruntime

import (
	"fmt"
	"log"
	"time"

	"github.com/dop251/goja"
)

const (
	VMMaxCodeSize = 1 << 20          // 1MB code size limit
	VMExecTimeout = 10 * time.Second // single request max execution time
	VMLoadTimeout = 5 * time.Second  // code loading max time
)

// setupSandbox disables dangerous global objects in the goja VM.
func setupSandbox(vm *goja.Runtime) {
	vm.Set("require", goja.Undefined())
	vm.Set("process", goja.Undefined())
	vm.Set("eval", goja.Undefined())
	vm.Set("Function", goja.Undefined())
	vm.Set("globalThis", goja.Undefined())
	vm.Set("Proxy", goja.Undefined())
	vm.Set("Reflect", goja.Undefined())
}

// injectConsoleAPI injects a console object that forwards to Go's log package.
func injectConsoleAPI(vm *goja.Runtime, workspaceID string) {
	consoleObj := vm.NewObject()
	consoleObj.Set("log", func(call goja.FunctionCall) goja.Value {
		logWithLevel(workspaceID, "LOG", call)
		return goja.Undefined()
	})
	consoleObj.Set("warn", func(call goja.FunctionCall) goja.Value {
		logWithLevel(workspaceID, "WARN", call)
		return goja.Undefined()
	})
	consoleObj.Set("error", func(call goja.FunctionCall) goja.Value {
		logWithLevel(workspaceID, "ERROR", call)
		return goja.Undefined()
	})
	consoleObj.Set("info", func(call goja.FunctionCall) goja.Value {
		logWithLevel(workspaceID, "INFO", call)
		return goja.Undefined()
	})
	vm.Set("console", consoleObj)
}

func logWithLevel(workspaceID, level string, call goja.FunctionCall) {
	parts := make([]interface{}, len(call.Arguments))
	for i, arg := range call.Arguments {
		parts[i] = arg.Export()
	}
	log.Printf("[VM:%s] [%s] %v", workspaceID[:8], level, parts)
}

// validateCodeSize checks that the code does not exceed the maximum allowed size.
func validateCodeSize(code string) error {
	if len(code) > VMMaxCodeSize {
		return fmt.Errorf("code size %d exceeds maximum %d bytes", len(code), VMMaxCodeSize)
	}
	return nil
}

// withTimeout runs a function with a timeout by using goja's Interrupt mechanism.
func withTimeout(vm *goja.Runtime, timeout time.Duration, fn func() error) error {
	timer := time.AfterFunc(timeout, func() {
		vm.Interrupt("execution timeout exceeded")
	})
	defer timer.Stop()

	err := fn()
	if err != nil {
		if interrupted, ok := err.(*goja.InterruptedError); ok {
			return fmt.Errorf("timeout: %s", interrupted.String())
		}
		return err
	}
	return nil
}
