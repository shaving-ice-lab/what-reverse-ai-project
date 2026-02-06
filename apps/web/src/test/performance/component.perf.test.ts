/**
 * 前端组件性能测试
 * @description 测试核心 UI 组件的渲染性能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { benchmark, createPerformanceSuite, measureMemoryGrowth, formatBytes } from './utils';

/**
 * 模拟节点数据生成
 */
function generateMockNodes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    type: ['start', 'llm', 'http', 'condition', 'end'][i % 5],
    position: { x: (i % 10) * 200, y: Math.floor(i / 10) * 150 },
    data: {
      label: `Node ${i}`,
      config: {
        prompt: 'Test prompt '.repeat(10),
        model: 'gpt-4',
        temperature: 0.7,
      },
    },
  }));
}

/**
 * 模拟边数据生成
 */
function generateMockEdges(nodeCount: number) {
  const edges = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default',
    });
  }
  return edges;
}

/**
 * 模拟工作流状态更新
 */
function simulateWorkflowUpdate(nodes: ReturnType<typeof generateMockNodes>) {
  return nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      executionStatus: Math.random() > 0.5 ? 'completed' : 'pending',
    },
  }));
}

describe('组件渲染性能测试', () => {
  const suite = createPerformanceSuite('UI 组件性能');

  describe('节点数据处理性能', () => {
    it('生成 100 个节点应在 10ms 内完成', async () => {
      const result = await benchmark(
        '生成 100 节点',
        () => generateMockNodes(100),
        { iterations: 100 }
      );

      console.log(`生成 100 节点: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(10);
    });

    it('生成 500 个节点应在 50ms 内完成', async () => {
      const result = await benchmark(
        '生成 500 节点',
        () => generateMockNodes(500),
        { iterations: 50 }
      );

      console.log(`生成 500 节点: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(50);
    });

    it('生成 1000 个节点应在 100ms 内完成', async () => {
      const result = await benchmark(
        '生成 1000 节点',
        () => generateMockNodes(1000),
        { iterations: 20 }
      );

      console.log(`生成 1000 节点: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(100);
    });
  });

  describe('边数据处理性能', () => {
    it('生成 100 条边应在 5ms 内完成', async () => {
      const result = await benchmark(
        '生成 100 边',
        () => generateMockEdges(101),
        { iterations: 100 }
      );

      console.log(`生成 100 边: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });

    it('生成 500 条边应在 20ms 内完成', async () => {
      const result = await benchmark(
        '生成 500 边',
        () => generateMockEdges(501),
        { iterations: 50 }
      );

      console.log(`生成 500 边: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(20);
    });
  });

  describe('状态更新性能', () => {
    const nodes100 = generateMockNodes(100);
    const nodes500 = generateMockNodes(500);

    it('更新 100 节点状态应在 5ms 内完成', async () => {
      const result = await benchmark(
        '更新 100 节点状态',
        () => simulateWorkflowUpdate(nodes100),
        { iterations: 100 }
      );

      console.log(`更新 100 节点状态: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });

    it('更新 500 节点状态应在 20ms 内完成', async () => {
      const result = await benchmark(
        '更新 500 节点状态',
        () => simulateWorkflowUpdate(nodes500),
        { iterations: 50 }
      );

      console.log(`更新 500 节点状态: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(20);
    });
  });

  describe('JSON 序列化性能', () => {
    const workflow = {
      id: 'test-workflow',
      name: 'Performance Test Workflow',
      nodes: generateMockNodes(100),
      edges: generateMockEdges(100),
      settings: {
        timeout: 30000,
        retries: 3,
        parallel: true,
      },
    };

    it('序列化 100 节点工作流应在 5ms 内完成', async () => {
      const result = await benchmark(
        '序列化工作流',
        () => JSON.stringify(workflow),
        { iterations: 100 }
      );

      console.log(`序列化工作流: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });

    it('反序列化 100 节点工作流应在 5ms 内完成', async () => {
      const jsonStr = JSON.stringify(workflow);

      const result = await benchmark(
        '反序列化工作流',
        () => JSON.parse(jsonStr),
        { iterations: 100 }
      );

      console.log(`反序列化工作流: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });
  });

  describe('数组操作性能', () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random(),
      name: `Item ${i}`,
    }));

    it('filter 10000 项应在 5ms 内完成', async () => {
      const result = await benchmark(
        'filter 10000 项',
        () => largeArray.filter(item => item.value > 0.5),
        { iterations: 100 }
      );

      console.log(`filter 10000 项: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(5);
    });

    it('map 10000 项应在 10ms 内完成', async () => {
      const result = await benchmark(
        'map 10000 项',
        () => largeArray.map(item => ({ ...item, doubled: item.value * 2 })),
        { iterations: 100 }
      );

      console.log(`map 10000 项: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(10);
    });

    it('reduce 10000 项应在 2ms 内完成', async () => {
      const result = await benchmark(
        'reduce 10000 项',
        () => largeArray.reduce((sum, item) => sum + item.value, 0),
        { iterations: 100 }
      );

      console.log(`reduce 10000 项: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('find 10000 项应在 1ms 内完成', async () => {
      const result = await benchmark(
        'find 10000 项',
        () => largeArray.find(item => item.id === 9999),
        { iterations: 100 }
      );

      console.log(`find 10000 项: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(1);
    });
  });

  describe('对象操作性能', () => {
    const createDeepObject = () => ({
      level1: {
        level2: {
          level3: {
            level4: {
              data: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Deep Item ${i}`,
              })),
            },
          },
        },
      },
    });

    it('深拷贝对象应在 2ms 内完成', async () => {
      const obj = createDeepObject();

      const result = await benchmark(
        '深拷贝对象',
        () => JSON.parse(JSON.stringify(obj)),
        { iterations: 100 }
      );

      console.log(`深拷贝对象: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });

    it('structuredClone 应在 2ms 内完成', async () => {
      const obj = createDeepObject();

      const result = await benchmark(
        'structuredClone',
        () => structuredClone(obj),
        { iterations: 100 }
      );

      console.log(`structuredClone: ${result.averageTime.toFixed(2)}ms`);
      expect(result.averageTime).toBeLessThan(2);
    });
  });
});

describe('内存使用测试', () => {
  it('创建大量节点不应导致内存泄漏', async () => {
    const { growth } = await measureMemoryGrowth(
      () => {
        const nodes = generateMockNodes(100);
        const edges = generateMockEdges(100);
        // 模拟处理
        const processed = nodes.map(n => ({ ...n, processed: true }));
        return { nodes: processed, edges };
      },
      100
    );

    console.log(`内存增长: ${formatBytes(growth)}`);
    // 允许最多 50MB 的内存增长
    expect(growth).toBeLessThan(50 * 1024 * 1024);
  });

  it('重复序列化/反序列化不应累积内存', async () => {
    const workflow = {
      nodes: generateMockNodes(50),
      edges: generateMockEdges(50),
    };

    const { growth } = await measureMemoryGrowth(
      () => {
        const json = JSON.stringify(workflow);
        const parsed = JSON.parse(json);
        return parsed;
      },
      200
    );

    console.log(`序列化内存增长: ${formatBytes(growth)}`);
    // 允许最多 20MB 的内存增长
    expect(growth).toBeLessThan(20 * 1024 * 1024);
  });
});
