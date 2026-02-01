'use client';

/**
 * 分组节点组件
 * 
 * 功能：
 * - 将多个节点组织在一起
 * - 支持折叠/展开
 * - 支持自定义颜色主题
 * - 支持分组命名
 * - 支持调整大小
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { NodeResizer, type NodeProps, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
  Copy,
  FolderOpen,
  FolderClosed,
  Check,
  X,
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/useWorkflowStore';

// ===== 类型定义 =====

export interface GroupNodeData {
  label: string;
  description?: string;
  collapsed?: boolean;
  color?: GroupColor;
  config: Record<string, unknown>;
  inputs: never[];
  outputs: never[];
}

export type GroupColor = 
  | 'default'
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'cyan';

// ===== 颜色配置 =====

const colorConfig: Record<GroupColor, {
  border: string;
  bg: string;
  headerBg: string;
  text: string;
  accent: string;
}> = {
  default: {
    border: 'border-border',
    bg: 'bg-surface-100',
    headerBg: 'bg-surface-200',
    text: 'text-foreground',
    accent: 'bg-foreground-muted',
  },
  violet: {
    border: 'border-brand-500/30',
    bg: 'bg-brand-500/5',
    headerBg: 'bg-brand-200/40',
    text: 'text-brand-500',
    accent: 'bg-brand-500',
  },
  blue: {
    border: 'border-border',
    bg: 'bg-surface-100',
    headerBg: 'bg-surface-200',
    text: 'text-foreground-light',
    accent: 'bg-foreground-muted',
  },
  emerald: {
    border: 'border-brand-500/30',
    bg: 'bg-brand-500/5',
    headerBg: 'bg-brand-200/40',
    text: 'text-brand-500',
    accent: 'bg-brand-500',
  },
  amber: {
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    headerBg: 'bg-warning/20',
    text: 'text-warning',
    accent: 'bg-warning',
  },
  rose: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
    headerBg: 'bg-destructive/15',
    text: 'text-destructive',
    accent: 'bg-destructive',
  },
  orange: {
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    headerBg: 'bg-warning/20',
    text: 'text-warning',
    accent: 'bg-warning',
  },
  cyan: {
    border: 'border-border',
    bg: 'bg-surface-100',
    headerBg: 'bg-surface-200',
    text: 'text-foreground-light',
    accent: 'bg-foreground-muted',
  },
};

// ===== 最小尺寸 =====

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const COLLAPSED_HEIGHT = 40;

// ===== 组件 =====

export const GroupNode = memo(({ id, data, selected }: NodeProps<GroupNodeData>) => {
  const { updateNode, removeNodes } = useWorkflowStore();
  const { getNodes, setNodes } = useReactFlow();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const color = data.color || 'default';
  const config = colorConfig[color];
  const collapsed = data.collapsed ?? false;

  // 聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 保存标签
  const handleSaveLabel = useCallback(() => {
    if (editValue.trim()) {
      updateNode(id, { label: editValue.trim() });
    } else {
      setEditValue(data.label);
    }
    setIsEditing(false);
  }, [id, editValue, data.label, updateNode]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditValue(data.label);
    setIsEditing(false);
  }, [data.label]);

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveLabel, handleCancelEdit]);

  // 切换折叠状态
  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    updateNode(id, { 
      ...data,
      collapsed: newCollapsed,
    });
    
    // 隐藏/显示子节点
    const nodes = getNodes();
    const updatedNodes = nodes.map((node) => {
      if (node.parentId === id) {
        return {
          ...node,
          hidden: newCollapsed,
        };
      }
      return node;
    });
    setNodes(updatedNodes);
  }, [id, data, collapsed, updateNode, getNodes, setNodes]);

  // 更改颜色
  const handleChangeColor = useCallback((newColor: GroupColor) => {
    updateNode(id, { ...data, color: newColor });
  }, [id, data, updateNode]);

  // 删除分组
  const handleDelete = useCallback(() => {
    // 先将子节点从分组中移出
    const nodes = getNodes();
    const updatedNodes = nodes.map((node) => {
      if (node.parentId === id) {
        return {
          ...node,
          parentId: undefined,
          position: {
            // 转换为绝对坐标（需要获取分组节点位置）
            x: node.position.x + (nodes.find(n => n.id === id)?.position.x || 0),
            y: node.position.y + (nodes.find(n => n.id === id)?.position.y || 0),
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    
    // 然后删除分组节点
    removeNodes([id]);
  }, [id, getNodes, setNodes, removeNodes]);

  // 复制分组（包含子节点）
  const handleDuplicate = useCallback(() => {
    // TODO: 实现复制分组功能
    console.log('Duplicate group:', id);
  }, [id]);

  return (
    <>
      {/* 节点调整器 - 仅在未折叠时可调整大小 */}
      {!collapsed && (
        <NodeResizer
          minWidth={MIN_WIDTH}
          minHeight={MIN_HEIGHT}
          isVisible={selected}
          lineClassName="border-brand-500/40!"
          handleClassName="w-2.5! h-2.5! bg-brand-500! border-brand-500/60!"
        />
      )}

      {/* 分组容器 */}
      <div
        className={cn(
          'rounded-xl border-2 border-dashed transition-all duration-200',
          config.border,
          config.bg,
          selected && 'ring-2 ring-brand-500/30',
          collapsed ? 'h-10' : 'h-full min-h-[150px]'
        )}
        style={{
          minWidth: MIN_WIDTH,
          height: collapsed ? COLLAPSED_HEIGHT : '100%',
        }}
      >
        {/* 分组头部 */}
        <div
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-2 rounded-t-[10px]',
            config.headerBg,
            collapsed && 'rounded-b-[10px]'
          )}
        >
          {/* 左侧：折叠按钮 + 标题 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* 折叠/展开按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-foreground-muted hover:text-foreground"
              onClick={handleToggleCollapse}
            >
              {collapsed ? (
                <FolderClosed className="w-4 h-4" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
            </Button>

            {/* 颜色标识条 */}
            <div className={cn('w-1 h-4 rounded-full', config.accent)} />

            {/* 标题 */}
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveLabel}
                  className={cn(
                    'h-6 px-2 py-0 text-sm bg-surface-100 border-border',
                    'focus:ring-1 focus:ring-brand-500/50'
                  )}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-brand-500 hover:text-brand-600"
                  onClick={handleSaveLabel}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-foreground-muted hover:text-foreground"
                  onClick={handleCancelEdit}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <span
                className={cn('text-sm font-medium truncate cursor-pointer', config.text)}
                onDoubleClick={() => setIsEditing(true)}
                title="双击编辑名称"
              >
                {data.label}
              </span>
            )}
          </div>

          {/* 右侧：操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-foreground-muted hover:text-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-surface-100 border-border"
            >
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="text-foreground focus:bg-surface-200 focus:text-foreground"
              >
                <Pencil className="w-4 h-4 mr-2" />
                重命名
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={handleToggleCollapse}
                className="text-foreground focus:bg-surface-200 focus:text-foreground"
              >
                {collapsed ? (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    展开分组
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    折叠分组
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              {/* 颜色选择 */}
              <div className="px-2 py-1.5">
              <span className="text-xs text-foreground-muted mb-2 block">分组颜色</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(colorConfig) as GroupColor[]).map((colorKey) => (
                    <button
                      key={colorKey}
                      onClick={() => handleChangeColor(colorKey)}
                      className={cn(
                        'w-5 h-5 rounded-full transition-transform hover:scale-110',
                        colorConfig[colorKey].accent,
                        color === colorKey && 'ring-2 ring-white/50'
                      )}
                      title={colorKey}
                    />
                  ))}
                </div>
              </div>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem
                onClick={handleDuplicate}
                className="text-foreground focus:bg-surface-200 focus:text-foreground"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制分组
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-destructive-200 focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除分组
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 分组内容区域（仅在展开时显示） */}
        {!collapsed && (
          <div className="flex-1 p-2">
            {/* 子节点会自动渲染在此区域内 */}
            {data.description && (
              <p className="text-xs text-foreground-muted px-1">{data.description}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
