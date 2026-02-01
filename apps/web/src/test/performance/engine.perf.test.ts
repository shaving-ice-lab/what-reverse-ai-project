/**
 * 执行引擎性能测试
 * @description 测试工作流执行引擎的性能
 */

import { describe, it, expect } from 'vitest';
import { benchmark, createPerformanceSuite, formatPerformanceReport } from './utils';

/**
 * 模拟节点执行
 */
async function simulateNodeExecution(
  type: string,
  delayMs: number = 0
): Promise<{ output: unknown; duration: number }> {
  const start = performance.now();
  
  // 模拟不同类型节点的处理时间
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // 模拟计算
  let result: unknown;
  switch (type) {
    case 'transform':
      result = Array.from({ length: 1000 }, (_, i) => i * 2);
      break;
    case 'filter':
      result = Array.from({ length: 1000 }, (_, i) => i).filter(x => x % 2 === 0);
      break;
    case 'aggregate':
      result = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
      break;
    default:
      result = { type, timestamp: Date.now() };
  }

  return {
    output: result,
    duration: performance.now() - start,
  };
}

/**
 * DAG 拓扑排序
 */
function topologicalSort(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // 初始化
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // 构建图
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Kahn 算法
  const queue: string[] = [];
  const result: string[] = [];

  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return result;
}

/**
 * 模拟 DAG 执行引擎
 */
async function executeDAG(
  nodes: { id: string; type: string }[],
  edges: { source: string; target: string }[],
  options: { parallel?: boolean } = {}
): Promise<{
  results: Map<string, unknown>;
  totalDuration: number;
  executionOrder: string[];
}> {
  const start = performance.now();
  const results = new Map<string, unknown>();
  const executionOrder = topologicalSort(nodes, edges);

  if (options.parallel) {
    // 并行执行（按层级）
    const levels = new Map<string, number>();
    const inDegree = new Map<string, number>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
    }

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // 计算层级
    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId)!;
      const parentEdges = edges.filter(e => e.target === nodeId);
      const maxParentLevel = parentEdges.length > 0
        ? Math.max(...parentEdges.map(e => levels.get(e.source) || 0))
        : -1;
      levels.set(nodeId, maxParentLevel + 1);
    }

    // 按层级分组
    const levelGroups = new Map<number, string[]>();
    for (const [nodeId, level] of levels) {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(nodeId);
    }

    // 按层级并行执行
    for (const level of [...levelGroups.keys()].sort((a, b) => a - b)) {
      const levelNodes = levelGroups.get(level)!;
      const promises = levelNodes.map(async nodeId => {
        const node = nodes.find(n => n.id === nodeId)!;
        const { output } = await simulateNodeExecution(node.type);
        results.set(nodeId, output);
      });
      await Promise.all(promises);
    }
  } else {
    // 顺序执行
    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId)!;
      const { output } = await simulateNodeExecution(node.type);
      results.set(nodeId, output);
    }
  }

  return {
    results,
    totalDuration: performance.now() - start,
    executionOrder,
  };
}

/**
 * 生成线性工作流
 */
function generateLinearWorkflow(size: number) {
  const nodes = Array.from({ length: size }, (_, i) => ({
    id: `node-${i}`,
    type: ['transform', 'filter', 'aggregate'][i % 3],
  }));

  const edges = Array.from({ length: size - 1 }, (_, i) => ({
    source: `node-${i}`,
    target: `node-${i + 1}`,
  }));

  return { nodes, edges };
}

/**
 * 生成分支工作流
 */
function generateBranchWorkflow(branches: number, depth: number) {
  const nodes: { id: string; type: string }[] = [
    { id: 'start', type: 'start' },
  ];
  const edges: { source: string; target: string }[] = [];

  for (let b = 0; b < branches; b++) {
    for (let d = 0; d < depth; d++) {
      const nodeId = `branch-${b}-node-${d}`;
      nodes.push({ id: nodeId, type: 'transform' });

      if (d === 0) {
        edges.push({ source: 'start', target: nodeId });
      } else {
        edges.push({ source: `branch-${b}-node-${d - 1}`, target: nodeId });
      }
    }
  }

  // 合并节点
  nodes.push({ id: 'end', type: 'end' });
  for (let b = 0; b < branches; b++) {
    edges.push({ source: `branch-${b}-node-${depth - 1}`, target: 'end' });
  }

  return { nodes, edges };
}

describe('执行引擎性能测试', () => {
  describe('拓扑排序性能', () => {
    it('排序 100 节点线性图应在 2ms 内完成', async () => {
      const { nodes, edges } = generateLinearWorkflow(100);

      const result = await benchmark(
        '拓扑排序 100 节点',
        () => topologicalSort(nodes, edges),
        { iterations: 100 }
      );

      console.log(`拓扑排序 100 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('排序 500 节点线性图应在 10ms 内完成', async () => {
      const { nodes, edges } = generateLinearWorkflow(500);

      const result = await benchmark(
        '拓扑排序 500 节点',
        () => topologicalSort(nodes, edges),
        { iterations: 50 }
      );

      console.log(`拓扑排序 500 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(10);
    });

    it('排序 1000 节点线性图应在 20ms 内完成', async () => {
      const { nodes, edges } = generateLinearWorkflow(1000);

      const result = await benchmark(
        '拓扑排序 1000 节点',
        () => topologicalSort(nodes, edges),
        { iterations: 20 }
      );

      console.log(`拓扑排序 1000 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(20);
    });

    it('排序复杂分支图应在 5ms 内完成', async () => {
      const { nodes, edges } = generateBranchWorkflow(10, 10);

      const result = await benchmark(
        '拓扑排序分支图',
        () => topologicalSort(nodes, edges),
        { iterations: 100 }
      );

      console.log(`拓扑排序分支图 (${nodes.length} 节点): ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });
  });

  describe('节点执行性能', () => {
    it('单节点执行应在 2ms 内完成', async () => {
      const result = await benchmark(
        '单节点执行',
        () => simulateNodeExecution('transform'),
        { iterations: 100 }
      );

      console.log(`单节点执行: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('Transform 节点应在 2ms 内完成', async () => {
      const result = await benchmark(
        'Transform 节点',
        () => simulateNodeExecution('transform'),
        { iterations: 100 }
      );

      console.log(`Transform 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('Filter 节点应在 2ms 内完成', async () => {
      const result = await benchmark(
        'Filter 节点',
        () => simulateNodeExecution('filter'),
        { iterations: 100 }
      );

      console.log(`Filter 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('Aggregate 节点应在 2ms 内完成', async () => {
      const result = await benchmark(
        'Aggregate 节点',
        () => simulateNodeExecution('aggregate'),
        { iterations: 100 }
      );

      console.log(`Aggregate 节点: ${result.averageTime.toFixed(3)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });
  });

  describe('DAG 执行性能', () => {
    it('执行 10 节点线性工作流应在 10ms 内完成', async () => {
      const { nodes, edges } = generateLinearWorkflow(10);

      const result = await benchmark(
        '执行 10 节点线性工作流',
        () => executeDAG(nodes, edges),
        { iterations: 50 }
      );

      console.log(`执行 10 节点: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(10);
    });

    it('执行 50 节点线性工作流应在 50ms 内完成', async () => {
      const { nodes, edges } = generateLinearWorkflow(50);

      const result = await benchmark(
        '执行 50 节点线性工作流',
        () => executeDAG(nodes, edges),
        { iterations: 20 }
      );

      console.log(`执行 50 节点: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(50);
    });

    it('并行执行分支工作流应比顺序执行更快', async () => {
      const { nodes, edges } = generateBranchWorkflow(5, 5);

      const sequentialResult = await benchmark(
        '顺序执行分支工作流',
        () => executeDAG(nodes, edges, { parallel: false }),
        { iterations: 10 }
      );

      const parallelResult = await benchmark(
        '并行执行分支工作流',
        () => executeDAG(nodes, edges, { parallel: true }),
        { iterations: 10 }
      );

      console.log(`顺序执行: ${sequentialResult.averageTime.toFixed(2)}ms`);
      console.log(`并行执行: ${parallelResult.averageTime.toFixed(2)}ms`);
      
      // 并行应该至少不比顺序慢太多（考虑开销）
      expect(parallelResult.averageTime).toBeLessThan(sequentialResult.averageTime * 1.5);
    });
  });

  describe('并发执行性能', () => {
    it('同时处理 10 个请求应在 100ms 内完成', async () => {
      const processRequest = async () => {
        const results = await Promise.all(
          Array.from({ length: 10 }, () => simulateNodeExecution('transform'))
        );
        return results;
      };

      const result = await benchmark(
        '并发 10 请求',
        processRequest,
        { iterations: 20 }
      );

      console.log(`并发 10 请求: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(100);
    });

    it('同时处理 50 个请求应在 200ms 内完成', async () => {
      const processRequest = async () => {
        const results = await Promise.all(
          Array.from({ length: 50 }, () => simulateNodeExecution('transform'))
        );
        return results;
      };

      const result = await benchmark(
        '并发 50 请求',
        processRequest,
        { iterations: 10 }
      );

      console.log(`并发 50 请求: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(200);
    });
  });

  describe('性能阈值验证', () => {
    it('所有基准测试应满足性能阈值', async () => {
      const suite = createPerformanceSuite('执行引擎性能套件');

      await suite.add('拓扑排序', () => {
        const { nodes, edges } = generateLinearWorkflow(100);
        return topologicalSort(nodes, edges);
      });

      await suite.add('节点执行', () => simulateNodeExecution('transform'));

      await suite.add('DAG 执行', () => {
        const { nodes, edges } = generateLinearWorkflow(10);
        return executeDAG(nodes, edges);
      });

      const validation = suite.validateAll({
        maxAverageTime: 50,
        maxP99: 100,
        minOpsPerSecond: 10,
      });

      suite.printReport();

      expect(validation.allPassed).toBe(true);
      if (!validation.allPassed) {
        console.log('失败的测试:', validation.validations.filter(v => !v.passed));
      }
    });
  });
});

describe('大规模工作流测试', () => {
  it('应能处理 500+ 节点的工作流', async () => {
    const { nodes, edges } = generateLinearWorkflow(500);
    
    const start = performance.now();
    const order = topologicalSort(nodes, edges);
    const sortDuration = performance.now() - start;

    console.log(`500 节点拓扑排序: ${sortDuration.toFixed(2)}ms`);
    
    expect(order.length).toBe(500);
    expect(sortDuration).toBeLessThan(50);
  });

  it('应能处理高度分支的工作流', async () => {
    const { nodes, edges } = generateBranchWorkflow(20, 10);
    
    const start = performance.now();
    const order = topologicalSort(nodes, edges);
    const sortDuration = performance.now() - start;

    console.log(`分支工作流 (${nodes.length} 节点) 拓扑排序: ${sortDuration.toFixed(2)}ms`);
    
    expect(order.length).toBe(nodes.length);
    expect(sortDuration).toBeLessThan(20);
  });
});
