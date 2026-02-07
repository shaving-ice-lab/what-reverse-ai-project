import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Node, Edge } from "@xyflow/react";
import { generateId } from "@/lib/utils";

// ===== TypeDefinition =====

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

// GroupColorType
export type GroupColor = 
 | 'default'
 | 'violet'
 | 'blue'
 | 'emerald'
 | 'amber'
 | 'rose'
 | 'orange'
 | 'cyan';

// GroupNodeData
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
 // CurrentWorkflow
 workflow: Workflow | null;
 nodes: WorkflowNode[];
 edges: Edge[];
 
 // selectStatus
 selectedNodeIds: string[];
 selectedEdgeIds: string[];
 
 // 
 clipboard: ClipboardData | null;
 
 // HistoryRecord
 history: HistoryEntry[];
 historyIndex: number;
 maxHistory: number;
 
 // Status
 isDirty: boolean;
 isExecuting: boolean;
 
 // WorkflowAction
 setWorkflow: (workflow: Workflow) => void;
 clearWorkflow: () => void;
 updateWorkflowMeta: (data: Partial<Workflow>) => void;
 markSaved: () => void;
 
 // NodeAction
 setNodes: (nodes: WorkflowNode[]) => void;
 addNode: (node: WorkflowNode) => void;
 addNodes: (nodes: WorkflowNode[]) => void;
 updateNode: (id: string, data: Partial<WorkflowNode["data"]>) => void;
 updateNodePosition: (id: string, position: { x: number; y: number }) => void;
 removeNodes: (ids: string[]) => void;
 
 // ConnectionAction
 setEdges: (edges: Edge[]) => void;
 addEdge: (edge: Edge) => void;
 addEdges: (edges: Edge[]) => void;
 removeEdges: (ids: string[]) => void;
 
 // SelectAction
 selectNode: (id: string, multi?: boolean) => void;
 selectEdge: (id: string, multi?: boolean) => void;
 selectAll: () => void;
 clearSelection: () => void;
 
 // CopyPasteAction
 copySelectedNodes: () => void;
 pasteNodes: (offset?: { x: number; y: number }) => void;
 duplicateSelectedNodes: () => void;
 
 // HistoryAction
 saveHistory: () => void;
 undo: () => void;
 redo: () => void;
 canUndo: () => boolean;
 canRedo: () => boolean;
 
 // ExecuteStatus
 setExecuting: (isExecuting: boolean) => void;
 
 // GroupAction
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
 
 // WorkflowAction
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
 
 // NodeAction
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
 // timeDeleteRelatedConnection
 state.edges = state.edges.filter(
 (e) => !ids.includes(e.source) && !ids.includes(e.target)
 );
 state.selectedNodeIds = state.selectedNodeIds.filter((id) => !ids.includes(id));
 state.isDirty = true;
 });
 },
 
 // ConnectionAction
 setEdges: (edges) => {
 set((state) => {
 state.edges = edges;
 state.isDirty = true;
 });
 },
 
 addEdge: (edge) => {
 get().saveHistory();
 set((state) => {
 // CheckisnoAlready existsSameConnection
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
 
 // SelectAction
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
 
 // CopyPasteAction
 copySelectedNodes: () => {
 const { nodes, edges, selectedNodeIds } = get();
 
 if (selectedNodeIds.length === 0) return;
 
 // Fetchselect'sNode
 const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
 
 // FetchselectNodebetween'sConnection
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
 
 // Create ID Mapping (old ID -> new ID)
 const idMap: Record<string, string> = {};
 
 // CreatenewNode
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
 
 // CreatenewConnection (Update source and target asnew ID)
 const newEdges: Edge[] = clipboard.edges.map((edge) => ({
 ...JSON.parse(JSON.stringify(edge)),
 id: generateId("edge"),
 source: idMap[edge.source],
 target: idMap[edge.target],
 }));
 
 set((state) => {
 // Cancelbefore'sselectStatus
 state.nodes.forEach((n) => {
 n.selected = false;
 });
 
 // AddnewNodeandConnection
 state.nodes.push(...newNodes);
 state.edges.push(...newEdges);
 
 // UpdateselectStatus
 state.selectedNodeIds = newNodes.map((n) => n.id);
 state.selectedEdgeIds = [];
 state.isDirty = true;
 });
 },
 
 duplicateSelectedNodes: () => {
 get().copySelectedNodes();
 get().pasteNodes({ x: 50, y: 50 });
 },
 
 // HistoryAction
 saveHistory: () => {
 set((state) => {
 const entry: HistoryEntry = {
 nodes: JSON.parse(JSON.stringify(state.nodes)),
 edges: JSON.parse(JSON.stringify(state.edges)),
 timestamp: Date.now(),
 };
 
 // ifresultatHistorybetween, Deleteafterface'sRecord
 if (state.historyIndex < state.history.length - 1) {
 state.history = state.history.slice(0, state.historyIndex + 1);
 }
 
 state.history.push(entry);
 
 // LimitHistoryRecordCount
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
 
 // ExecuteStatus
 setExecuting: (isExecuting) => {
 set((state) => {
 state.isExecuting = isExecuting;
 });
 },
 
 // ===== GroupAction =====
 
 // CreateGroup
 createGroup: (nodeIds, label = "newGroup", color = "default") => {
 if (nodeIds.length === 0) return null;
 
 const { nodes, saveHistory } = get();
 saveHistory();
 
 // Fetchselect'sNode
 const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
 if (selectedNodes.length === 0) return null;
 
 // CalculateGroup'sEdge
 let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
 selectedNodes.forEach((node) => {
 const nodeWidth = 280; // DefaultNodeWidth
 const nodeHeight = 120; // DefaultNodeHeight
 minX = Math.min(minX, node.position.x);
 minY = Math.min(minY, node.position.y);
 maxX = Math.max(maxX, node.position.x + nodeWidth);
 maxY = Math.max(maxY, node.position.y + nodeHeight);
 });
 
 // AddEdge
 const padding = 40;
 const groupX = minX - padding;
 const groupY = minY - padding - 40; // outsideEmptybetweentoTitle
 const groupWidth = maxX - minX + padding * 2;
 const groupHeight = maxY - minY + padding * 2 + 40;
 
 // CreateGroupNode
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
 // AddGroupNode(atAllNodebefore, thisstyleitwillRenderatdownface)
 state.nodes.unshift(groupNode);
 
 // UpdateNode's parentId andfor
 state.nodes.forEach((node) => {
 if (nodeIds.includes(node.id)) {
 node.parentId = groupId;
 node.position = {
 x: node.position.x - groupX,
 y: node.position.y - groupY,
 };
 // EnsureNodeDisplayatGroupin
 node.extent = "parent";
 }
 });
 
 state.isDirty = true;
 });
 
 return groupId;
 },
 
 // Group
 ungroup: (groupId) => {
 const { nodes, saveHistory } = get();
 saveHistory();
 
 const groupNode = nodes.find((n) => n.id === groupId && n.type === "group");
 if (!groupNode) return;
 
 set((state) => {
 // willNodeConvertforCoordinate
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
 
 // RemoveGroupNode
 state.nodes = state.nodes.filter((n) => n.id !== groupId);
 state.isDirty = true;
 });
 },
 
 // willNodeAddtoGroup
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
 // ConvertasforatGroup'sCoordinate
 node.position = {
 x: node.position.x - groupNode.position.x,
 y: node.position.y - groupNode.position.y,
 };
 }
 });
 state.isDirty = true;
 });
 },
 
 // willNodefromGroup
 removeNodesFromGroup: (nodeIds) => {
 const { nodes, saveHistory } = get();
 saveHistory();
 
 set((state) => {
 state.nodes.forEach((node) => {
 if (nodeIds.includes(node.id) && node.parentId) {
 const groupNode = state.nodes.find((n) => n.id === node.parentId);
 if (groupNode) {
 // ConvertforCoordinate
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
 
 // UpdateGroupstyle
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
 
 // SwitchGroupCollapseStatus
 toggleGroupCollapse: (groupId) => {
 set((state) => {
 const groupNode = state.nodes.find((n) => n.id === groupId && n.type === "group");
 if (groupNode) {
 const data = groupNode.data as unknown as { collapsed?: boolean };
 const newCollapsed = !data.collapsed;
 data.collapsed = newCollapsed;
 
 // Hide/DisplayNode
 state.nodes.forEach((node) => {
 if (node.parentId === groupId) {
 node.hidden = newCollapsed;
 }
 });
 
 state.isDirty = true;
 }
 });
 },
 
 // FetchGroup'sNode
 getGroupChildren: (groupId) => {
 const { nodes } = get();
 return nodes.filter((n) => n.parentId === groupId);
 },
 }))
);
