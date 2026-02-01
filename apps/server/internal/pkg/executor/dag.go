package executor

import (
	"errors"
	"sort"
)

var (
	ErrCycleDetected    = errors.New("cycle detected in workflow")
	ErrNoStartNode      = errors.New("no start node found")
	ErrMultipleStart    = errors.New("multiple start nodes found")
	ErrDisconnectedNode = errors.New("disconnected node found")
)

// DAG 有向无环图
type DAG struct {
	Nodes       map[string]*NodeDefinition
	Edges       map[string][]string // source -> targets
	InDegree    map[string]int
	OutEdges    map[string][]EdgeDefinition
	StartNodeID string
	EndNodeIDs  []string
}

// NewDAG 从工作流定义创建 DAG
func NewDAG(def *WorkflowDefinition) (*DAG, error) {
	dag := &DAG{
		Nodes:      make(map[string]*NodeDefinition),
		Edges:      make(map[string][]string),
		InDegree:   make(map[string]int),
		OutEdges:   make(map[string][]EdgeDefinition),
		EndNodeIDs: make([]string, 0),
	}

	// 添加节点
	for i := range def.Nodes {
		node := &def.Nodes[i]
		dag.Nodes[node.ID] = node
		dag.InDegree[node.ID] = 0
		dag.Edges[node.ID] = make([]string, 0)

		// 识别开始和结束节点
		if node.Type == NodeTypeStart {
			if dag.StartNodeID != "" {
				return nil, ErrMultipleStart
			}
			dag.StartNodeID = node.ID
		} else if node.Type == NodeTypeEnd {
			dag.EndNodeIDs = append(dag.EndNodeIDs, node.ID)
		}
	}

	if dag.StartNodeID == "" {
		return nil, ErrNoStartNode
	}

	// 添加边
	for _, edge := range def.Edges {
		dag.Edges[edge.Source] = append(dag.Edges[edge.Source], edge.Target)
		dag.InDegree[edge.Target]++
		dag.OutEdges[edge.Source] = append(dag.OutEdges[edge.Source], edge)
	}

	// 检测循环
	if hasCycle := dag.detectCycle(); hasCycle {
		return nil, ErrCycleDetected
	}

	return dag, nil
}

// detectCycle 使用 DFS 检测循环
func (d *DAG) detectCycle() bool {
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	var dfs func(nodeID string) bool
	dfs = func(nodeID string) bool {
		visited[nodeID] = true
		recStack[nodeID] = true

		for _, target := range d.Edges[nodeID] {
			if !visited[target] {
				if dfs(target) {
					return true
				}
			} else if recStack[target] {
				return true
			}
		}

		recStack[nodeID] = false
		return false
	}

	for nodeID := range d.Nodes {
		if !visited[nodeID] {
			if dfs(nodeID) {
				return true
			}
		}
	}

	return false
}

// TopologicalSort 拓扑排序
func (d *DAG) TopologicalSort() ([]string, error) {
	inDegree := make(map[string]int)
	for k, v := range d.InDegree {
		inDegree[k] = v
	}

	// 从入度为 0 的节点开始
	queue := make([]string, 0)
	for nodeID, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, nodeID)
		}
	}

	// 按 ID 排序以保证稳定性
	sort.Strings(queue)

	result := make([]string, 0, len(d.Nodes))

	for len(queue) > 0 {
		// 取出第一个节点
		nodeID := queue[0]
		queue = queue[1:]
		result = append(result, nodeID)

		// 减少相邻节点的入度
		for _, target := range d.Edges[nodeID] {
			inDegree[target]--
			if inDegree[target] == 0 {
				queue = append(queue, target)
				// 重新排序
				sort.Strings(queue)
			}
		}
	}

	// 检查是否所有节点都被处理
	if len(result) != len(d.Nodes) {
		return nil, ErrCycleDetected
	}

	return result, nil
}

// GetExecutionLevels 获取执行层级 (可并行执行的节点组)
func (d *DAG) GetExecutionLevels() ([][]string, error) {
	inDegree := make(map[string]int)
	for k, v := range d.InDegree {
		inDegree[k] = v
	}

	levels := make([][]string, 0)
	processed := make(map[string]bool)

	for len(processed) < len(d.Nodes) {
		// 找出当前可执行的节点 (入度为 0)
		level := make([]string, 0)
		for nodeID, degree := range inDegree {
			if degree == 0 && !processed[nodeID] {
				level = append(level, nodeID)
			}
		}

		if len(level) == 0 {
			return nil, ErrCycleDetected
		}

		// 排序以保证稳定性
		sort.Strings(level)
		levels = append(levels, level)

		// 标记为已处理，更新入度
		for _, nodeID := range level {
			processed[nodeID] = true
			for _, target := range d.Edges[nodeID] {
				inDegree[target]--
			}
		}
	}

	return levels, nil
}

// GetPredecessors 获取节点的前置节点
func (d *DAG) GetPredecessors(nodeID string) []string {
	predecessors := make([]string, 0)
	for source, targets := range d.Edges {
		for _, target := range targets {
			if target == nodeID {
				predecessors = append(predecessors, source)
			}
		}
	}
	return predecessors
}

// GetSuccessors 获取节点的后继节点
func (d *DAG) GetSuccessors(nodeID string) []string {
	return d.Edges[nodeID]
}

// GetNode 获取节点定义
func (d *DAG) GetNode(nodeID string) *NodeDefinition {
	return d.Nodes[nodeID]
}

// GetOutEdge 获取从源节点到目标节点的边
func (d *DAG) GetOutEdge(sourceID, targetID string) *EdgeDefinition {
	for _, edge := range d.OutEdges[sourceID] {
		if edge.Target == targetID {
			return &edge
		}
	}
	return nil
}
