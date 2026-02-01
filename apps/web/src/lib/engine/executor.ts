/**
 * 工作流执行引擎
 */

import { generateId } from "@/lib/utils";
import { getNodeExecutor } from "@/lib/nodes";
import type { NodeContext, NodeResult, LogEntry } from "@/lib/nodes/types";
import type { WorkflowNode } from "@/types/workflow";
import {
  analyzeDAG,
  getExecutableNodes,
} from "./dag";
import type {
  ExecutionConfig,
  ExecutionInput,
  ExecutionResult,
  ExecutionStatus,
  WorkflowExecutionState,
  NodeExecutionState,
  ExecutionEvent,
  ExecutionEventListener,
  DAGAnalysis,
} from "./types";

/**
 * 默认执行配置
 */
const DEFAULT_CONFIG: Required<ExecutionConfig> = {
  timeout: 600000, // 10 分钟
  nodeTimeout: 60000, // 1 分钟
  retryCount: 0,
  retryDelay: 1000,
  maxConcurrency: 5,
  debug: false,
  breakpoints: [],
  onNodeStart: () => {},
  onNodeComplete: () => {},
  onNodeError: () => {},
  onLog: () => {},
  onStateChange: () => {},
};

/**
 * 工作流执行引擎
 */
export class WorkflowExecutor {
  private state: WorkflowExecutionState;
  private config: Required<ExecutionConfig>;
  private dag: DAGAnalysis;
  private nodeMap: Map<string, WorkflowNode>;
  private abortController: AbortController;
  private listeners: Set<ExecutionEventListener>;
  private runningPromises: Map<string, Promise<void>>;

  constructor(input: ExecutionInput) {
    const { workflow, inputs = {}, config = {} } = input;

    // 合并配置
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 分析 DAG
    this.dag = analyzeDAG(workflow.nodes, workflow.edges);

    // 构建节点映射
    this.nodeMap = new Map();
    for (const node of workflow.nodes) {
      this.nodeMap.set(node.id, node);
    }

    // 初始化状态
    const executionId = generateId();
    this.state = {
      executionId,
      workflowId: workflow.id,
      status: "pending",
      startTime: new Date().toISOString(),
      nodeStates: {},
      variables: { ...workflow.variables, ...inputs },
      currentNodeIds: [],
      completedNodeIds: [],
      failedNodeIds: [],
      logs: [],
    };

    // 初始化节点状态
    for (const node of workflow.nodes) {
      this.state.nodeStates[node.id] = {
        nodeId: node.id,
        status: "pending",
      };
    }

    this.abortController = new AbortController();
    this.listeners = new Set();
    this.runningPromises = new Map();
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: ExecutionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: ExecutionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error("Event listener error:", e);
      }
    }
  }

  /**
   * 添加日志
   */
  private log(level: LogEntry["level"], message: string, data?: unknown): void {
    const log: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
    this.state.logs.push(log);
    this.config.onLog(log);
    this.emit({ type: "log", log });
  }

  /**
   * 更新状态
   */
  private updateState(partial: Partial<WorkflowExecutionState>): void {
    this.state = { ...this.state, ...partial };
    this.config.onStateChange(this.state);
  }

  /**
   * 更新节点状态
   */
  private updateNodeState(
    nodeId: string,
    partial: Partial<NodeExecutionState>
  ): void {
    this.state.nodeStates[nodeId] = {
      ...this.state.nodeStates[nodeId],
      ...partial,
    };
    this.config.onStateChange(this.state);
  }

  /**
   * 执行工作流
   */
  async execute(): Promise<ExecutionResult> {
    // 检查循环依赖
    if (this.dag.hasCircle) {
      const error = {
        code: "CIRCULAR_DEPENDENCY",
        message: "Workflow contains circular dependencies",
      };
      this.updateState({ status: "failed", error });
      return this.buildResult("failed", error);
    }

    // 检查是否有起始节点
    if (this.dag.startNodes.length === 0) {
      const error = {
        code: "NO_START_NODE",
        message: "Workflow has no start nodes",
      };
      this.updateState({ status: "failed", error });
      return this.buildResult("failed", error);
    }

    // 开始执行
    this.updateState({ status: "running", startTime: new Date().toISOString() });
    this.emit({ type: "start", executionId: this.state.executionId, timestamp: new Date().toISOString() });
    this.log("info", "Workflow execution started");

    try {
      // 执行主循环
      await this.executeLoop();

      // 检查执行结果
      const allCompleted = Object.values(this.state.nodeStates).every(
        (ns) => ns.status === "completed" || ns.status === "cancelled"
      );

      if (this.state.status === "cancelled") {
        return this.buildResult("cancelled");
      }

      if (this.state.failedNodeIds.length > 0) {
        const failedNode = this.state.nodeStates[this.state.failedNodeIds[0]];
        const error = {
          code: "NODE_EXECUTION_FAILED",
          message: failedNode?.error?.message || "Node execution failed",
          nodeId: this.state.failedNodeIds[0],
        };
        this.updateState({ status: "failed", error });
        return this.buildResult("failed", error);
      }

      if (allCompleted) {
        this.updateState({ status: "completed" });
        this.log("info", "Workflow execution completed successfully");
        return this.buildResult("completed");
      }

      // 意外状态
      const error = {
        code: "UNEXPECTED_STATE",
        message: "Workflow ended in unexpected state",
      };
      this.updateState({ status: "failed", error });
      return this.buildResult("failed", error);
    } catch (error) {
      const errorObj = {
        code: "EXECUTION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
      this.updateState({ status: "failed", error: errorObj });
      this.log("error", errorObj.message);
      return this.buildResult("failed", errorObj);
    }
  }

  /**
   * 执行循环
   */
  private async executeLoop(): Promise<void> {
    const completedNodes = new Set(this.state.completedNodeIds);
    const runningNodes = new Set(this.state.currentNodeIds);

    while (true) {
      // 检查取消
      if (this.abortController.signal.aborted) {
        break;
      }

      // 获取可执行节点
      const executableNodes = getExecutableNodes(
        this.dag.nodes,
        completedNodes,
        runningNodes
      );

      // 没有可执行节点了
      if (executableNodes.length === 0 && runningNodes.size === 0) {
        break;
      }

      // 限制并发数
      const availableSlots = this.config.maxConcurrency - runningNodes.size;
      const nodesToExecute = executableNodes.slice(0, availableSlots);

      // 启动节点执行
      for (const nodeId of nodesToExecute) {
        runningNodes.add(nodeId);
        this.state.currentNodeIds.push(nodeId);

        const promise = this.executeNode(nodeId)
          .then(() => {
            completedNodes.add(nodeId);
            this.state.completedNodeIds.push(nodeId);
          })
          .catch((error) => {
            this.state.failedNodeIds.push(nodeId);
            this.log("error", `Node ${nodeId} failed: ${error.message}`);
          })
          .finally(() => {
            runningNodes.delete(nodeId);
            this.state.currentNodeIds = this.state.currentNodeIds.filter(
              (id) => id !== nodeId
            );
            this.runningPromises.delete(nodeId);
          });

        this.runningPromises.set(nodeId, promise);
      }

      // 等待任一节点完成
      if (this.runningPromises.size > 0) {
        await Promise.race(this.runningPromises.values());
      }

      // 检查是否有失败节点
      if (this.state.failedNodeIds.length > 0) {
        // 等待所有正在运行的节点完成
        await Promise.all(this.runningPromises.values());
        break;
      }
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(nodeId: string): Promise<void> {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // 获取节点类型和执行器
    const nodeType = node.type || "unknown";
    const executor = getNodeExecutor(nodeType);

    // 更新状态
    this.updateNodeState(nodeId, {
      status: "running",
      startTime: new Date().toISOString(),
    });
    this.emit({ type: "node_start", nodeId, timestamp: new Date().toISOString() });
    this.config.onNodeStart(nodeId);
    this.log("info", `Executing node: ${nodeId} (${nodeType})`);

    // 收集输入
    const inputs = this.collectNodeInputs(nodeId);

    // 构建执行上下文
    const context: NodeContext = {
      nodeId,
      nodeType,
      nodeConfig: node.data?.config || {},
      variables: this.state.variables,
      inputs,
      abortSignal: this.abortController.signal,
    };

    let result: NodeResult;

    if (!executor) {
      // 没有执行器，标记为完成
      this.log("warn", `No executor for node type: ${nodeType}`);
      result = {
        success: true,
        outputs: inputs,
        logs: [
          {
            level: "warn",
            message: `No executor for type ${nodeType}, passing through`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } else {
      // 执行节点
      try {
        result = await executor.execute(context);
      } catch (error) {
        result = {
          success: false,
          outputs: {},
          error: {
            code: "EXECUTOR_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            details: error,
            retryable: false,
          },
        };
      }
    }

    // 处理结果
    const endTime = new Date().toISOString();
    const startTime = this.state.nodeStates[nodeId].startTime || endTime;
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    if (result.success) {
      // 成功
      this.updateNodeState(nodeId, {
        status: "completed",
        endTime,
        duration,
        outputs: result.outputs,
        logs: result.logs,
      });

      // 更新变量
      if (result.outputs) {
        this.state.variables = {
          ...this.state.variables,
          [`${nodeId}`]: result.outputs,
        };
      }

      this.emit({
        type: "node_complete",
        nodeId,
        result,
        timestamp: endTime,
      });
      this.config.onNodeComplete(nodeId, result);
      this.log("info", `Node ${nodeId} completed in ${duration}ms`);
    } else {
      // 失败
      this.updateNodeState(nodeId, {
        status: "failed",
        endTime,
        duration,
        error: result.error,
        logs: result.logs,
      });

      this.emit({
        type: "node_error",
        nodeId,
        error: result.error,
        timestamp: endTime,
      });
      this.config.onNodeError(nodeId, result.error);

      throw new Error(result.error?.message || "Node execution failed");
    }
  }

  /**
   * 收集节点输入
   */
  private collectNodeInputs(nodeId: string): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    const dagNode = this.dag.nodes[nodeId];

    if (!dagNode) return inputs;

    // 从依赖节点收集输出
    for (const depId of dagNode.dependencies) {
      const depState = this.state.nodeStates[depId];
      if (depState?.outputs) {
        Object.assign(inputs, depState.outputs);
      }
    }

    return inputs;
  }

  /**
   * 构建执行结果
   */
  private buildResult(
    status: ExecutionStatus,
    error?: { code: string; message: string; nodeId?: string }
  ): ExecutionResult {
    const endTime = new Date().toISOString();
    const duration =
      new Date(endTime).getTime() - new Date(this.state.startTime).getTime();

    this.updateState({ endTime, duration });

    // 收集所有节点的输出
    const outputs: Record<string, unknown> = {};
    const nodeResults: Record<string, NodeResult> = {};

    for (const [nodeId, nodeState] of Object.entries(this.state.nodeStates)) {
      if (nodeState.outputs) {
        outputs[nodeId] = nodeState.outputs;
      }
      nodeResults[nodeId] = {
        success: nodeState.status === "completed",
        outputs: nodeState.outputs || {},
        error: nodeState.error,
        logs: nodeState.logs,
        duration: nodeState.duration,
      };
    }

    const result: ExecutionResult = {
      executionId: this.state.executionId,
      status,
      outputs,
      duration,
      nodeResults,
      logs: this.state.logs,
      error,
    };

    this.emit({ type: "complete", result, timestamp: endTime });

    return result;
  }

  /**
   * 取消执行
   */
  cancel(): void {
    this.abortController.abort();
    this.updateState({ status: "cancelled" });
    this.emit({ type: "cancel", timestamp: new Date().toISOString() });
    this.log("info", "Workflow execution cancelled");
  }

  /**
   * 获取当前状态
   */
  getState(): WorkflowExecutionState {
    return { ...this.state };
  }

  /**
   * 获取执行 ID
   */
  getExecutionId(): string {
    return this.state.executionId;
  }
}

/**
 * 执行工作流的便捷函数
 */
export async function executeWorkflow(
  input: ExecutionInput
): Promise<ExecutionResult> {
  const executor = new WorkflowExecutor(input);
  return executor.execute();
}
