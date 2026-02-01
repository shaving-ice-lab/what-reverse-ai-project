package creative

import (
	"errors"
	"sync"
)

var (
	ErrSectionNotFound     = errors.New("section not found")
	ErrCyclicDependency    = errors.New("cyclic dependency detected")
	ErrDependencyNotReady  = errors.New("dependency section not ready")
)

// ========================
// 章节依赖图
// ========================

// SectionDependencyGraph 章节依赖图
type SectionDependencyGraph struct {
	sections   map[string]*SectionNode
	order      []string // 拓扑排序后的执行顺序
	parallel   [][]string // 可并行执行的章节组
	mu         sync.RWMutex
}

// SectionNode 章节节点
type SectionNode struct {
	ID        string
	DependsOn []string // 依赖的章节
	DependedBy []string // 被依赖的章节
	InDegree  int      // 入度 (依赖数量)
}

// NewSectionDependencyGraph 创建章节依赖图
func NewSectionDependencyGraph(sections []OutputSectionConfig) (*SectionDependencyGraph, error) {
	g := &SectionDependencyGraph{
		sections: make(map[string]*SectionNode),
	}

	// 创建节点
	for _, section := range sections {
		g.sections[section.ID] = &SectionNode{
			ID:        section.ID,
			DependsOn: section.DependsOn,
			DependedBy: make([]string, 0),
		}
	}

	// 建立依赖关系
	for _, node := range g.sections {
		for _, depID := range node.DependsOn {
			if depNode, ok := g.sections[depID]; ok {
				depNode.DependedBy = append(depNode.DependedBy, node.ID)
				node.InDegree++
			}
		}
	}

	// 进行拓扑排序
	if err := g.topologicalSort(); err != nil {
		return nil, err
	}

	// 计算并行分组
	g.computeParallelGroups()

	return g, nil
}

// topologicalSort 拓扑排序 (Kahn's algorithm)
func (g *SectionDependencyGraph) topologicalSort() error {
	g.mu.Lock()
	defer g.mu.Unlock()

	// 复制入度
	inDegree := make(map[string]int)
	for id, node := range g.sections {
		inDegree[id] = node.InDegree
	}

	// 找到所有入度为0的节点
	queue := make([]string, 0)
	for id, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, id)
		}
	}

	// BFS
	order := make([]string, 0, len(g.sections))
	for len(queue) > 0 {
		// 出队
		current := queue[0]
		queue = queue[1:]
		order = append(order, current)

		// 处理依赖当前节点的节点
		for _, nextID := range g.sections[current].DependedBy {
			inDegree[nextID]--
			if inDegree[nextID] == 0 {
				queue = append(queue, nextID)
			}
		}
	}

	// 检查是否存在环
	if len(order) != len(g.sections) {
		return ErrCyclicDependency
	}

	g.order = order
	return nil
}

// computeParallelGroups 计算可并行执行的章节组
func (g *SectionDependencyGraph) computeParallelGroups() {
	g.parallel = make([][]string, 0)

	// 复制入度
	inDegree := make(map[string]int)
	for id, node := range g.sections {
		inDegree[id] = node.InDegree
	}

	completed := make(map[string]bool)

	for len(completed) < len(g.sections) {
		// 找出所有可以并行执行的章节 (入度为0)
		group := make([]string, 0)
		for id, degree := range inDegree {
			if degree == 0 && !completed[id] {
				group = append(group, id)
			}
		}

		if len(group) == 0 {
			break // 不应该发生,因为已通过拓扑排序检测环
		}

		g.parallel = append(g.parallel, group)

		// 标记完成并更新入度
		for _, id := range group {
			completed[id] = true
			for _, nextID := range g.sections[id].DependedBy {
				inDegree[nextID]--
			}
		}
	}
}

// GetExecutionOrder 获取执行顺序
func (g *SectionDependencyGraph) GetExecutionOrder() []string {
	g.mu.RLock()
	defer g.mu.RUnlock()
	result := make([]string, len(g.order))
	copy(result, g.order)
	return result
}

// GetParallelGroups 获取并行执行组
func (g *SectionDependencyGraph) GetParallelGroups() [][]string {
	g.mu.RLock()
	defer g.mu.RUnlock()
	result := make([][]string, len(g.parallel))
	for i, group := range g.parallel {
		result[i] = make([]string, len(group))
		copy(result[i], group)
	}
	return result
}

// GetDependencies 获取章节的依赖
func (g *SectionDependencyGraph) GetDependencies(sectionID string) ([]string, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()
	
	node, ok := g.sections[sectionID]
	if !ok {
		return nil, ErrSectionNotFound
	}
	
	result := make([]string, len(node.DependsOn))
	copy(result, node.DependsOn)
	return result, nil
}

// ========================
// 章节执行队列
// ========================

// SectionQueue 章节执行队列
type SectionQueue struct {
	graph     *SectionDependencyGraph
	pending   map[string]bool
	running   map[string]bool
	completed map[string]bool
	failed    map[string]bool
	mu        sync.RWMutex
}

// NewSectionQueue 创建章节执行队列
func NewSectionQueue(sections []OutputSectionConfig) (*SectionQueue, error) {
	graph, err := NewSectionDependencyGraph(sections)
	if err != nil {
		return nil, err
	}

	queue := &SectionQueue{
		graph:     graph,
		pending:   make(map[string]bool),
		running:   make(map[string]bool),
		completed: make(map[string]bool),
		failed:    make(map[string]bool),
	}

	// 初始化所有章节为待处理
	for _, sectionID := range graph.GetExecutionOrder() {
		queue.pending[sectionID] = true
	}

	return queue, nil
}

// GetReadySections 获取可以执行的章节 (依赖已完成)
func (q *SectionQueue) GetReadySections() []string {
	q.mu.RLock()
	defer q.mu.RUnlock()

	ready := make([]string, 0)
	for sectionID := range q.pending {
		deps, _ := q.graph.GetDependencies(sectionID)
		allDepsCompleted := true
		for _, depID := range deps {
			if !q.completed[depID] {
				allDepsCompleted = false
				break
			}
		}
		if allDepsCompleted {
			ready = append(ready, sectionID)
		}
	}

	return ready
}

// StartSection 开始执行章节
func (q *SectionQueue) StartSection(sectionID string) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	if !q.pending[sectionID] {
		if q.running[sectionID] {
			return nil // 已经在运行
		}
		if q.completed[sectionID] || q.failed[sectionID] {
			return nil // 已经完成或失败
		}
		return ErrSectionNotFound
	}

	delete(q.pending, sectionID)
	q.running[sectionID] = true
	return nil
}

// CompleteSection 完成章节
func (q *SectionQueue) CompleteSection(sectionID string) {
	q.mu.Lock()
	defer q.mu.Unlock()

	delete(q.running, sectionID)
	q.completed[sectionID] = true
}

// FailSection 章节失败
func (q *SectionQueue) FailSection(sectionID string) {
	q.mu.Lock()
	defer q.mu.Unlock()

	delete(q.running, sectionID)
	q.failed[sectionID] = true
}

// RetrySection 重试章节
func (q *SectionQueue) RetrySection(sectionID string) {
	q.mu.Lock()
	defer q.mu.Unlock()

	delete(q.failed, sectionID)
	q.pending[sectionID] = true
}

// IsComplete 检查所有章节是否完成
func (q *SectionQueue) IsComplete() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.pending) == 0 && len(q.running) == 0 && len(q.failed) == 0
}

// HasFailed 检查是否有失败的章节
func (q *SectionQueue) HasFailed() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.failed) > 0
}

// GetStatus 获取队列状态
func (q *SectionQueue) GetStatus() (pending, running, completed, failed int) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.pending), len(q.running), len(q.completed), len(q.failed)
}

// GetCompletedSections 获取已完成的章节ID列表
func (q *SectionQueue) GetCompletedSections() []string {
	q.mu.RLock()
	defer q.mu.RUnlock()
	result := make([]string, 0, len(q.completed))
	for id := range q.completed {
		result = append(result, id)
	}
	return result
}

// GetFailedSections 获取失败的章节ID列表
func (q *SectionQueue) GetFailedSections() []string {
	q.mu.RLock()
	defer q.mu.RUnlock()
	result := make([]string, 0, len(q.failed))
	for id := range q.failed {
		result = append(result, id)
	}
	return result
}

// GetParallelGroups 获取并行执行组
func (q *SectionQueue) GetParallelGroups() [][]string {
	return q.graph.GetParallelGroups()
}
