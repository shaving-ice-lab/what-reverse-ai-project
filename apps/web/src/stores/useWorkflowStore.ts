import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Node, Edge } from "@xyflow/react";
import { generateId } from "@/lib/utils";

// ===== 类型定义 =====

export interface WorkflowNode extends Node {
  data: {
    label: string;
    icon?: string;
    description?: string;
    config: Record<string, unknown>;
    inputs: PortDefinition[];
    outputs: PortDefinition[];
  };
}

export interface PortDefinition {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  required?: boolean;
  multiple?: boolean;
  defaultValue?: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "draft" | "published" | "archived";
  triggerType: "manual" | "schedule" | "webhook" | "event";
  triggerConfig: Record<string, unknown>;
  variables: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEntry {
  nodes: WorkflowNode[];
  edges: Edge[];
  timestamp: number;
}

interface ClipboardData {
  nodes: WorkflowNode[];
  edges: Edge[];
}

// 分组颜色类型
export type GroupColor = 
  | 'default'
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'cyan';

// 分组节点数据
export interface GroupNodeData {
  label: string;
  description?: string;
  collapsed?: boolean;
  color?: GroupColor;
  config: Record<string, unknown>;
  inputs: never[];
  outputs: never[];
}

interface WorkflowState {
  // 当前工作流
  workflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: Edge[];
  
  // 选中状态
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  
  // 剪贴板
  clipboard: ClipboardData | null;
  
  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;
  
  // 状态
  isDirty: boolean;
  isExecuting: boolean;
  
  // 工作流操作
  setWorkflow: (workflow: Workflow) => void;
  clearWorkflow: () => void;
  updateWorkflowMeta: (data: Partial<Workflow>) => void;
  markSaved: () => void;
  
  // 节点操作
  setNodes: (nodes: WorkflowNode[]) => void;
  addNode: (node: WorkflowNode) => void;
  addNodes: (nodes: WorkflowNode[]) => void;
  updateNode: (id: string, data: Partial<WorkflowNode["data"]>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  removeNodes: (ids: string[]) => void;
  
  // 连线操作
  setEdges: (edges: Edge[]) => void;
  addEdge: (edge: Edge) => void;
  addEdges: (edges: Edge[]) => void;
  removeEdges: (ids: string[]) => void;
  
  // 选择操作
  selectNode: (id: string, multi?: boolean) => void;
  selectEdge: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 复制粘贴操作
  copySelectedNodes: () => void;
  pasteNodes: (offset?: { x: number; y: number }) => void;
  duplicateSelectedNodes: () => void;
  
  // 历史操作
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // 执行状态
  setExecuting: (isExecuting: boolean) => void;
  
  // 分组操作
  createGroup: (nodeIds: string[], label?: string, color?: GroupColor) => string | null;
  ungroup: (groupId: string) => void;
  addNodesToGroup: (nodeIds: string[], groupId: string) => void;
  removeNodesFromGroup: (nodeIds: string[]) => void;
  updateGroupStyle: (groupId: string, style: { color?: GroupColor; label?: string; collapsed?: boolean }) => void;
  toggleGroupCollapse: (groupId: string) => void;
  getGroupChildren: (groupId: string) => WorkflowNode[];
}

// ===== Store =====

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
    workflow: null,
    nodes: [],
    edges: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    clipboard: null,
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    isDirty: false,
    isExecuting: false,
    
    // 工作流操作
    setWorkflow: (workflow) => {
      set((state) => {
        state.workflow = workflow;
        state.isDirty = false;
      });
    },
    
    clearWorkflow: () => {
      set((state) => {
        state.workflow = null;
        state.nodes = [];
        state.edges = [];
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
        state.history = [];
        state.historyIndex = -1;
        state.isDirty = false;
      });
    },
    
    updateWorkflowMeta: (data) => {
      set((state) => {
        if (state.workflow) {
          Object.assign(state.workflow, data);
          state.isDirty = true;
        }
      });
    },

    markSaved: () => {
      set((state) => {
        state.isDirty = false;
      });
    },
    
    // 节点操作
    setNodes: (nodes) => {
      set((state) => {
        state.nodes = nodes;
        state.isDirty = true;
      });
    },
    
    addNode: (node) => {
      get().saveHistory();
      set((state) => {
        state.nodes.push(node);
        state.isDirty = true;
      });
    },
    
    addNodes: (nodes) => {
      get().saveHistory();
      set((state) => {
        state.nodes.push(...nodes);
        state.isDirty = true;
      });
    },
    
    updateNode: (id, data) => {
      get().saveHistory();
      set((state) => {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          Object.assign(node.data, data);
          state.isDirty = true;
        }
      });
    },
    
    updateNodePosition: (id, position) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          node.position = position;
          state.isDirty = true;
        }
      });
    },
    
    removeNodes: (ids) => {
      get().saveHistory();
      set((state) => {
        state.nodes = state.nodes.filter((n) => !ids.includes(n.id));
        // 同时删除相关连线
        state.edges = state.edges.filter(
          (e) => !ids.includes(e.source) && !ids.includes(e.target)
        );
        state.selectedNodeIds = state.selectedNodeIds.filter((id) => !ids.includes(id));
        state.isDirty = true;
      });
    },
    
    // 连线操作
    setEdges: (edges) => {
      set((state) => {
        state.edges = edges;
        state.isDirty = true;
      });
    },
    
    addEdge: (edge) => {
      get().saveHistory();
      set((state) => {
        // 检查是否已存在相同连线
        const exists = state.edges.some(
          (e) =>
            e.source === edge.source &&
            e.target === edge.target &&
            e.sourceHandle === edge.sourceHandle &&
            e.targetHandle === edge.targetHandle
        );
        
        if (!exists) {
          state.edges.push({
            ...edge,
            id: edge.id || generateId("edge"),
          });
          state.isDirty = true;
        }
      });
    },
    
    addEdges: (edges) => {
      get().saveHistory();
      set((state) => {
        edges.forEach((edge) => {
          const exists = state.edges.some(
            (e) =>
              e.source === edge.source &&
              e.target === edge.target &&
              e.sourceHandle === edge.sourceHandle &&
              e.targetHandle === edge.targetHandle
          );
          
          if (!exists) {
            state.edges.push({
              ...edge,
              id: edge.id || generateId("edge"),
            });
          }
        });
        state.isDirty = true;
      });
    },
    
    removeEdges: (ids) => {
      get().saveHistory();
      set((state) => {
        state.edges = state.edges.filter((e) => !ids.includes(e.id));
        state.selectedEdgeIds = state.selectedEdgeIds.filter((id) => !ids.includes(id));
        state.isDirty = true;
      });
    },
    
    // 选择操作
    selectNode: (id, multi = false) => {
      set((state) => {
        if (multi) {
          const index = state.selectedNodeIds.indexOf(id);
          if (index === -1) {
            state.selectedNodeIds.push(id);
          } else {
            state.selectedNodeIds.splice(index, 1);
          }
        } else {
          state.selectedNodeIds = [id];
          state.selectedEdgeIds = [];
        }
      });
    },
    
    selectEdge: (id, multi = false) => {
      set((state) => {
        if (multi) {
          const index = state.selectedEdgeIds.indexOf(id);
          if (index === -1) {
            state.selectedEdgeIds.push(id);
          } else {
            state.selectedEdgeIds.splice(index, 1);
          }
        } else {
          state.selectedEdgeIds = [id];
          state.selectedNodeIds = [];
        }
      });
    },
    
    selectAll: () => {
      set((state) => {
        state.selectedNodeIds = state.nodes.map((n) => n.id);
        state.selectedEdgeIds = state.edges.map((e) => e.id);
      });
    },
    
    clearSelection: () => {
      set((state) => {
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
      });
    },
    
    // 复制粘贴操作
    copySelectedNodes: () => {
      const { nodes, edges, selectedNodeIds } = get();
      
      if (selectedNodeIds.length === 0) return;
      
      // 获取选中的节点
      const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
      
      // 获取选中节点之间的连线
      const selectedEdges = edges.filter(
        (e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
      );
      
      set((state) => {
        state.clipboard = {
          nodes: JSON.parse(JSON.stringify(selectedNodes)),
          edges: JSON.parse(JSON.stringify(selectedEdges)),
        };
      });
    },
    
    pasteNodes: (offset = { x: 50, y: 50 }) => {
      const { clipboard } = get();
      
      if (!clipboard || clipboard.nodes.length === 0) return;
      
      get().saveHistory();
      
      // 创建 ID 映射 (旧 ID -> 新 ID)
      const idMap: Record<string, string> = {};
      
      // 创建新节点
      const newNodes: WorkflowNode[] = clipboard.nodes.map((node) => {
        const newId = generateId("node");
        idMap[node.id] = newId;
        
        return {
          ...JSON.parse(JSON.stringify(node)),
          id: newId,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
          selected: true,
        };
      });
      
      // 创建新连线 (更新 source 和 target 为新 ID)
      const newEdges: Edge[] = clipboard.edges.map((edge) => ({
        ...JSON.parse(JSON.stringify(edge)),
        id: generateId("edge"),
        source: idMap[edge.source],
        target: idMap[edge.target],
      }));
      
      set((state) => {
        // 取消之前的选中状态
        state.nodes.forEach((n) => {
          n.selected = false;
        });
        
        // 添加新节点和连线
        state.nodes.push(...newNodes);
        state.edges.push(...newEdges);
        
        // 更新选中状态
        state.selectedNodeIds = newNodes.map((n) => n.id);
        state.selectedEdgeIds = [];
        state.isDirty = true;
      });
    },
    
    duplicateSelectedNodes: () => {
      get().copySelectedNodes();
      get().pasteNodes({ x: 50, y: 50 });
    },
    
    // 历史操作
    saveHistory: () => {
      set((state) => {
        const entry: HistoryEntry = {
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          edges: JSON.parse(JSON.stringify(state.edges)),
          timestamp: Date.now(),
        };
        
        // 如果在历史中间，删除后面的记录
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        state.history.push(entry);
        
        // 限制历史记录数量
        if (state.history.length > state.maxHistory) {
          state.history = state.history.slice(-state.maxHistory);
        }
        
        state.historyIndex = state.history.length - 1;
      });
    },
    
    undo: () => {
      const { history, historyIndex } = get();
      
      if (historyIndex > 0) {
        const prevEntry = history[historyIndex - 1];
        
        set((state) => {
          state.nodes = JSON.parse(JSON.stringify(prevEntry.nodes));
          state.edges = JSON.parse(JSON.stringify(prevEntry.edges));
          state.historyIndex = historyIndex - 1;
          state.isDirty = true;
        });
      }
    },
    
    redo: () => {
      const { history, historyIndex } = get();
      
      if (historyIndex < history.length - 1) {
        const nextEntry = history[historyIndex + 1];
        
        set((state) => {
          state.nodes = JSON.parse(JSON.stringify(nextEntry.nodes));
          state.edges = JSON.parse(JSON.stringify(nextEntry.edges));
          state.historyIndex = historyIndex + 1;
          state.isDirty = true;
        });
      }
    },
    
    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },
    
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },
    
    // 执行状态
    setExecuting: (isExecuting) => {
      set((state) => {
        state.isExecuting = isExecuting;
      });
    },
    
    // ===== 分组操作 =====
    
    // 创建分组
    createGroup: (nodeIds, label = "新分组", color = "default") => {
      if (nodeIds.length === 0) return null;
      
      const { nodes, saveHistory } = get();
      saveHistory();
      
      // 获取选中的节点
      const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
      if (selectedNodes.length === 0) return null;
      
      // 计算分组的边界框
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selectedNodes.forEach((node) => {
        const nodeWidth = 280; // 默认节点宽度
        const nodeHeight = 120; // 默认节点高度
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });
      
      // 添加边距
      const padding = 40;
      const groupX = minX - padding;
      const groupY = minY - padding - 40; // 额外空间给标题栏
      const groupWidth = maxX - minX + padding * 2;
      const groupHeight = maxY - minY + padding * 2 + 40;
      
      // 创建分组节点
      const groupId = generateId("group");
      const groupNode: WorkflowNode = {
        id: groupId,
        type: "group",
        position: { x: groupX, y: groupY },
        style: { width: groupWidth, height: groupHeight },
        data: {
          label,
          description: "",
          collapsed: false,
          color,
          config: {},
          inputs: [],
          outputs: [],
        } as unknown as WorkflowNode["data"],
      };
      
      set((state) => {
        // 添加分组节点（在所有节点之前，这样它会渲染在下面）
        state.nodes.unshift(groupNode);
        
        // 更新子节点的 parentId 和相对位置
        state.nodes.forEach((node) => {
          if (nodeIds.includes(node.id)) {
            node.parentId = groupId;
            node.position = {
              x: node.position.x - groupX,
              y: node.position.y - groupY,
            };
            // 确保子节点显示在分组内
            node.extent = "parent";
          }
        });
        
        state.isDirty = true;
      });
      
      return groupId;
    },
    
    // 解散分组
    ungroup: (groupId) => {
      const { nodes, saveHistory } = get();
      saveHistory();
      
      const groupNode = nodes.find((n) => n.id === groupId && n.type === "group");
      if (!groupNode) return;
      
      set((state) => {
        // 将子节点转换回绝对坐标
        state.nodes.forEach((node) => {
          if (node.parentId === groupId) {
            node.parentId = undefined;
            node.extent = undefined;
            node.position = {
              x: node.position.x + groupNode.position.x,
              y: node.position.y + groupNode.position.y,
            };
          }
        });
        
        // 移除分组节点
        state.nodes = state.nodes.filter((n) => n.id !== groupId);
        state.isDirty = true;
      });
    },
    
    // 将节点添加到分组
    addNodesToGroup: (nodeIds, groupId) => {
      const { nodes, saveHistory } = get();
      saveHistory();
      
      const groupNode = nodes.find((n) => n.id === groupId && n.type === "group");
      if (!groupNode) return;
      
      set((state) => {
        state.nodes.forEach((node) => {
          if (nodeIds.includes(node.id) && !node.parentId) {
            node.parentId = groupId;
            node.extent = "parent";
            // 转换为相对于分组的坐标
            node.position = {
              x: node.position.x - groupNode.position.x,
              y: node.position.y - groupNode.position.y,
            };
          }
        });
        state.isDirty = true;
      });
    },
    
    // 将节点从分组中移出
    removeNodesFromGroup: (nodeIds) => {
      const { nodes, saveHistory } = get();
      saveHistory();
      
      set((state) => {
        state.nodes.forEach((node) => {
          if (nodeIds.includes(node.id) && node.parentId) {
            const groupNode = state.nodes.find((n) => n.id === node.parentId);
            if (groupNode) {
              // 转换回绝对坐标
              node.position = {
                x: node.position.x + groupNode.position.x,
                y: node.position.y + groupNode.position.y,
              };
            }
            node.parentId = undefined;
            node.extent = undefined;
          }
        });
        state.isDirty = true;
      });
    },
    
    // 更新分组样式
    updateGroupStyle: (groupId, style) => {
      const { saveHistory } = get();
      saveHistory();
      
      set((state) => {
        const groupNode = state.nodes.find((n) => n.id === groupId && n.type === "group");
        if (groupNode) {
          const data = groupNode.data as unknown as { label: string; color?: string; collapsed?: boolean };
          if (style.label !== undefined) data.label = style.label;
          if (style.color !== undefined) data.color = style.color;
          if (style.collapsed !== undefined) data.collapsed = style.collapsed;
          state.isDirty = true;
        }
      });
    },
    
    // 切换分组折叠状态
    toggleGroupCollapse: (groupId) => {
      set((state) => {
        const groupNode = state.nodes.find((n) => n.id === groupId && n.type === "group");
        if (groupNode) {
          const data = groupNode.data as unknown as { collapsed?: boolean };
          const newCollapsed = !data.collapsed;
          data.collapsed = newCollapsed;
          
          // 隐藏/显示子节点
          state.nodes.forEach((node) => {
            if (node.parentId === groupId) {
              node.hidden = newCollapsed;
            }
          });
          
          state.isDirty = true;
        }
      });
    },
    
    // 获取分组的子节点
    getGroupChildren: (groupId) => {
      const { nodes } = get();
      return nodes.filter((n) => n.parentId === groupId);
    },
  }))
);
