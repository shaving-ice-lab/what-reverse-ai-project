package executor

import (
	"context"
	"testing"
	"time"
)

// TestDAGConstruction 测试 DAG 构建
func TestDAGConstruction(t *testing.T) {
	def := &WorkflowDefinition{
		Nodes: []NodeDefinition{
			{ID: "start", Type: NodeTypeStart},
			{ID: "process", Type: NodeTypeVariable},
			{ID: "end", Type: NodeTypeEnd},
		},
		Edges: []EdgeDefinition{
			{ID: "e1", Source: "start", Target: "process"},
			{ID: "e2", Source: "process", Target: "end"},
		},
	}

	dag, err := NewDAG(def)
	if err != nil {
		t.Fatalf("Failed to create DAG: %v", err)
	}

	// 验证节点数量
	if len(dag.Nodes) != 3 {
		t.Errorf("Expected 3 nodes, got %d", len(dag.Nodes))
	}

	// 验证起始节点
	if dag.StartNodeID != "start" {
		t.Errorf("Expected start node to be 'start', got %v", dag.StartNodeID)
	}

	// 验证结束节点
	if len(dag.EndNodeIDs) != 1 || dag.EndNodeIDs[0] != "end" {
		t.Errorf("Expected end node to be 'end', got %v", dag.EndNodeIDs)
	}
}

// TestDAGCycleDetection 测试循环检测
func TestDAGCycleDetection(t *testing.T) {
	def := &WorkflowDefinition{
		Nodes: []NodeDefinition{
			{ID: "a", Type: NodeTypeVariable},
			{ID: "b", Type: NodeTypeVariable},
			{ID: "c", Type: NodeTypeVariable},
		},
		Edges: []EdgeDefinition{
			{ID: "e1", Source: "a", Target: "b"},
			{ID: "e2", Source: "b", Target: "c"},
			{ID: "e3", Source: "c", Target: "a"}, // 创建循环
		},
	}

	_, err := NewDAG(def)
	if err == nil {
		t.Error("Expected error for cyclic graph, got nil")
	}
}

// TestDAGExecutionLevels 测试执行层级
func TestDAGExecutionLevels(t *testing.T) {
	def := &WorkflowDefinition{
		Nodes: []NodeDefinition{
			{ID: "start", Type: NodeTypeStart},
			{ID: "a", Type: NodeTypeVariable},
			{ID: "b", Type: NodeTypeVariable},
			{ID: "c", Type: NodeTypeVariable},
			{ID: "end", Type: NodeTypeEnd},
		},
		Edges: []EdgeDefinition{
			{ID: "e1", Source: "start", Target: "a"},
			{ID: "e2", Source: "start", Target: "b"},
			{ID: "e3", Source: "a", Target: "c"},
			{ID: "e4", Source: "b", Target: "c"},
			{ID: "e5", Source: "c", Target: "end"},
		},
	}

	dag, err := NewDAG(def)
	if err != nil {
		t.Fatalf("Failed to create DAG: %v", err)
	}

	levels, err := dag.GetExecutionLevels()
	if err != nil {
		t.Fatalf("Failed to get execution levels: %v", err)
	}

	// 应该有 4 个层级: start -> [a,b] -> c -> end
	if len(levels) != 4 {
		t.Errorf("Expected 4 levels, got %d", len(levels))
	}

	// 第一层应该只有 start
	if len(levels[0]) != 1 || levels[0][0] != "start" {
		t.Errorf("Expected first level to be [start], got %v", levels[0])
	}

	// 第二层应该有 a 和 b (可以并行执行)
	if len(levels[1]) != 2 {
		t.Errorf("Expected second level to have 2 nodes, got %d", len(levels[1]))
	}
}

// TestExecutionContext 测试执行上下文
func TestExecutionContext(t *testing.T) {
	ctx := NewExecutionContext("exec-123", "workflow-456", "user-789")

	// 测试变量设置和获取
	ctx.Variables["input"] = "test"
	if ctx.Variables["input"] != "test" {
		t.Error("Failed to set/get variable")
	}

	// 测试节点输出
	ctx.SetNodeOutput("node-1", map[string]interface{}{"result": "success"})
	outputs := ctx.GetNodeOutput("node-1")
	if outputs == nil || outputs["result"] != "success" {
		t.Error("Failed to set/get node output")
	}

	// 测试取消
	if ctx.IsCancelled() {
		t.Error("Context should not be cancelled initially")
	}

	ctx.Cancel()
	if !ctx.IsCancelled() {
		t.Error("Context should be cancelled after Cancel()")
	}
}

// TestStartExecutor 测试开始节点执行器
func TestStartExecutor(t *testing.T) {
	executor := NewStartExecutor()

	if executor.GetType() != NodeTypeStart {
		t.Errorf("Expected type %s, got %s", NodeTypeStart, executor.GetType())
	}

	node := &NodeDefinition{
		ID:   "start-1",
		Type: NodeTypeStart,
	}
	inputs := map[string]interface{}{"input": "value"}
	ctx := NewExecutionContext("exec-1", "wf-1", "user-1")

	result, err := executor.Execute(context.Background(), node, inputs, ctx)
	if err != nil {
		t.Fatalf("Start executor failed: %v", err)
	}

	if result.Status != NodeStatusCompleted {
		t.Errorf("Expected status %s, got %s", NodeStatusCompleted, result.Status)
	}

	// 开始节点应该传递输入
	if result.Outputs["input"] != "value" {
		t.Error("Start node should pass through inputs")
	}
}

// TestEndExecutor 测试结束节点执行器
func TestEndExecutor(t *testing.T) {
	executor := NewEndExecutor()

	if executor.GetType() != NodeTypeEnd {
		t.Errorf("Expected type %s, got %s", NodeTypeEnd, executor.GetType())
	}

	node := &NodeDefinition{
		ID:   "end-1",
		Type: NodeTypeEnd,
	}
	inputs := map[string]interface{}{"result": "final"}
	ctx := NewExecutionContext("exec-1", "wf-1", "user-1")

	result, err := executor.Execute(context.Background(), node, inputs, ctx)
	if err != nil {
		t.Fatalf("End executor failed: %v", err)
	}

	if result.Status != NodeStatusCompleted {
		t.Errorf("Expected status %s, got %s", NodeStatusCompleted, result.Status)
	}

	// 结束节点应该传递输入作为最终输出
	if result.Outputs["result"] != "final" {
		t.Error("End node should pass through inputs as outputs")
	}
}

// TestVariableExecutor 测试变量节点执行器
func TestVariableExecutor(t *testing.T) {
	executor := NewVariableExecutor()

	node := &NodeDefinition{
		ID:   "var-1",
		Type: NodeTypeVariable,
		Config: map[string]interface{}{
			"variables": map[string]interface{}{
				"name":  "test",
				"count": 42,
			},
		},
	}
	ctx := NewExecutionContext("exec-1", "wf-1", "user-1")

	result, err := executor.Execute(context.Background(), node, nil, ctx)
	if err != nil {
		t.Fatalf("Variable executor failed: %v", err)
	}

	if result.Outputs["name"] != "test" {
		t.Errorf("Expected name='test', got %v", result.Outputs["name"])
	}

	if result.Outputs["count"] != 42 {
		t.Errorf("Expected count=42, got %v", result.Outputs["count"])
	}
}

// TestConditionExecutor 测试条件节点执行器
func TestConditionExecutor(t *testing.T) {
	executor := NewConditionExecutor()

	testCases := []struct {
		name     string
		config   map[string]interface{}
		inputs   map[string]interface{}
		expected string
	}{
		{
			name: "equals - true",
			config: map[string]interface{}{
				"field":    "status",
				"operator": "equals",
				"value":    "active",
			},
			inputs:   map[string]interface{}{"status": "active"},
			expected: "true",
		},
		{
			name: "equals - false",
			config: map[string]interface{}{
				"field":    "status",
				"operator": "equals",
				"value":    "active",
			},
			inputs:   map[string]interface{}{"status": "inactive"},
			expected: "false",
		},
		{
			name: "greater_than - true",
			config: map[string]interface{}{
				"field":    "count",
				"operator": "greater_than",
				"value":    10.0,
			},
			inputs:   map[string]interface{}{"count": 15.0},
			expected: "true",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			node := &NodeDefinition{
				ID:     "cond-1",
				Type:   NodeTypeCondition,
				Config: tc.config,
			}
			ctx := NewExecutionContext("exec-1", "wf-1", "user-1")

			result, err := executor.Execute(context.Background(), node, tc.inputs, ctx)
			if err != nil {
				t.Fatalf("Condition executor failed: %v", err)
			}

			if result.Outputs["branch"] != tc.expected {
				t.Errorf("Expected branch=%s, got %v", tc.expected, result.Outputs["branch"])
			}
		})
	}
}

// TestExecutionTimeout 测试执行超时
func TestExecutionTimeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	execCtx := NewExecutionContext("exec-1", "wf-1", "user-1")

	// 模拟长时间运行的任务
	select {
	case <-ctx.Done():
		// 预期超时
	case <-time.After(200 * time.Millisecond):
		t.Error("Expected timeout but task completed")
	}

	if ctx.Err() != context.DeadlineExceeded {
		t.Errorf("Expected DeadlineExceeded, got %v", ctx.Err())
	}

	_ = execCtx // 使用变量避免警告
}

// TestExecutionCancellation 测试执行取消
func TestExecutionCancellation(t *testing.T) {
	execCtx := NewExecutionContext("exec-1", "wf-1", "user-1")

	// 启动一个 goroutine 来取消执行
	go func() {
		time.Sleep(50 * time.Millisecond)
		execCtx.Cancel()
	}()

	// 等待取消
	select {
	case <-execCtx.CancelChan:
		// 预期取消
	case <-time.After(200 * time.Millisecond):
		t.Error("Expected cancellation but didn't receive")
	}

	if !execCtx.IsCancelled() {
		t.Error("Expected context to be cancelled")
	}
}
