'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useExecutionStore, type ExecutionLog, type ExecutionStatus } from '@/stores/useExecutionStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { workflowApi } from '@/lib/api';
import { executionApi } from '@/lib/api/execution';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VirtualScrollArea } from '@/components/ui/scroll-area';
import {
 Play,
 Square,
 RotateCcw,
 CheckCircle2,
 XCircle,
 AlertCircle,
 Loader2,
 Info,
 AlertTriangle,
 Bug,
 ChevronDown,
 ExternalLink,
 Terminal,
 Zap,
 Variable,
} from 'lucide-react';

/**
 * Execution Panel - Manus Style
 * Collapsible footer panel containing Output, Logs, and Variables tabs
 */

type TabType = 'output' | 'logs' | 'variables';

interface ExecutionPanelProps {
 workflowId: string;
 onExecute?: () => void;
 onCancel?: () => void;
 className?: string;
}

export function ExecutionPanel({
 workflowId,
 onExecute,
 onCancel,
 className,
}: ExecutionPanelProps) {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<TabType>('output');
 const [isExecuting, setIsExecuting] = useState(false);
 const [isCancelling, setIsCancelling] = useState(false);
 const logEndRef = useRef<HTMLDivElement>(null);

 const {
 currentExecutionId,
 executions,
 handleWSMessage,
 clearExecution,
 startExecution,
 completeExecution,
 setCurrentExecution,
 } = useExecutionStore();

 const {
 subscribe,
 unsubscribe,
 isConnected,
 } = useWebSocket({
 onMessage: handleWSMessage,
 onConnect: () => {
 console.log('WebSocket connected in ExecutionPanel');
 },
 });

 const currentExecution = currentExecutionId ? executions[currentExecutionId] : null;

  // Execute workflow
 const handleExecute = useCallback(async () => {
 if (isExecuting || workflowId === 'new') return;
 
 setIsExecuting(true);
 try {
 const response = await workflowApi.execute(workflowId, {});
 const executionId = response.executionId;
 
    // Use store to start tracking execution
 startExecution(executionId, workflowId, 0);
 setCurrentExecution(executionId);
 
    // Subscribe to execution updates
 if (isConnected) {
 subscribe(executionId);
 }
 
    // Call component callback
 onExecute?.();
 } catch (err) {
 console.error('Execute workflow failed:', err);
 } finally {
 setIsExecuting(false);
 }
 }, [workflowId, isExecuting, isConnected, startExecution, setCurrentExecution, subscribe, onExecute]);

  // Cancel execution
 const handleCancel = useCallback(async () => {
 if (!currentExecutionId || isCancelling) return;
 
 setIsCancelling(true);
 try {
 await executionApi.cancel(currentExecutionId);
 completeExecution(currentExecutionId, 'cancelled');
 
 // Unsubscribe
 if (isConnected) {
 unsubscribe(currentExecutionId);
 }
 
 onCancel?.();
 } catch (err) {
 console.error('Failed to cancel execution:', err);
 } finally {
 setIsCancelling(false);
 }
 }, [currentExecutionId, isCancelling, isConnected, completeExecution, unsubscribe, onCancel]);

  // Navigate to execution details
 const handleViewDetail = () => {
 if (currentExecutionId) {
 router.push(`/executions/${currentExecutionId}`);
 }
 };

 useEffect(() => {
 if (currentExecutionId && isConnected) {
 subscribe(currentExecutionId);
 return () => {
 unsubscribe(currentExecutionId);
 };
 }
 }, [currentExecutionId, isConnected, subscribe, unsubscribe]);

 useEffect(() => {
 logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [currentExecution?.logs.length]);

 const getStatusIcon = (status: ExecutionStatus) => {
 switch (status) {
 case 'pending':
 return <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground-muted" />;
 case 'running':
 return <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />;
 case 'completed':
 return <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />;
 case 'failed':
 return <XCircle className="h-3.5 w-3.5 text-destructive" />;
 case 'cancelled':
 return <AlertCircle className="h-3.5 w-3.5 text-warning" />;
 }
 };

 const getLogIcon = (level: ExecutionLog['level']) => {
 switch (level) {
 case 'info':
 return <Info className="h-3 w-3 text-brand-500" />;
 case 'warn':
 return <AlertTriangle className="h-3 w-3 text-warning" />;
 case 'error':
 return <XCircle className="h-3 w-3 text-destructive" />;
 case 'debug':
 return <Bug className="h-3 w-3 text-foreground-muted" />;
 }
 };

 const formatTime = (date: Date) => {
 return new Intl.DateTimeFormat('zh-CN', {
 hour: '2-digit',
 minute: '2-digit',
 second: '2-digit',
 }).format(date);
 };

 const isRunning = currentExecution?.status === 'running';

  // Tab Button Component with Icon
 const TabButton = ({ tab, label, icon: Icon, count }: { tab: TabType; label: string; icon: React.ElementType; count?: number }) => (
 <button
 onClick={() => setActiveTab(tab)}
 className={cn(
 "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
 activeTab === tab 
 ? "text-foreground bg-surface-200/80" 
 : "text-foreground-muted hover:text-foreground hover:bg-surface-200/50"
 )}
 >
 <Icon className="w-3.5 h-3.5" />
 <span>{label}</span>
 {count !== undefined && count > 0 && (
 <span className={cn(
 "px-1.5 py-0.5 rounded text-[10px] tabular-nums",
 activeTab === tab 
 ? "bg-surface-200/70 text-foreground" 
 : "bg-surface-200/70 text-foreground-muted"
 )}>
 {count}
 </span>
 )}
 </button>
 );

 const logs = currentExecution?.logs ?? [];
 const logCount = logs.length;
 const outputCount = logs.filter(l => l.level === 'info').length || 0;
 const variableCount = currentExecution?.nodes ? Object.keys(currentExecution.nodes).length : 0;
 const panelHeight = 200;
 const logRowHeight = 32;
 const logViewportHeight = panelHeight;

 return (
 <div className={cn('bg-transparent h-full flex flex-col', className)}>
 {/* Header - Optimized Tabs */}
 <div className="h-11 px-4 flex items-center justify-between border-b border-border bg-surface-75/80">
 <div className="flex gap-1">
 <TabButton tab="output" label="Output" icon={Terminal} count={outputCount} />
 <TabButton tab="logs" label="Logs" icon={Zap} count={logCount} />
 <TabButton tab="variables" label="Variables" icon={Variable} count={variableCount} />
 </div>
 <div className="flex items-center gap-2">
          {/* Connection Status */}
 <div className={cn(
 "flex items-center gap-1 px-2 py-0.5 rounded text-xs",
 isConnected ? "text-brand-500" : "text-foreground-muted"
 )}>
 <span className={cn(
 "w-1.5 h-1.5 rounded-full",
 isConnected ? "bg-brand-500" : "bg-foreground-muted"
 )} />
 {isConnected ? "Connected": "Disconnected"}
 </div>
 
 {currentExecution && (
 <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
 {getStatusIcon(currentExecution.status)}
 {currentExecution.durationMs 
 ? `${(currentExecution.durationMs / 1000).toFixed(2)}s`
 : currentExecution.status === 'running' 
              ? 'Running...'
 : ''
 }
 </div>
 )}
 
          {/* View Details Button */}
 {currentExecution && (
 <Button
 size="sm"
 variant="ghost"
 onClick={handleViewDetail}
 className="h-6 px-2 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-200"
 >
 <ExternalLink className="h-3 w-3 mr-1" />
 Details
 </Button>
 )}
 
          {/* Clear/Cancel Button */}
 {currentExecution && isRunning && (
 <Button
 size="sm"
 variant="ghost"
 onClick={handleCancel}
 disabled={isCancelling}
 className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive-200"
 >
 {isCancelling ? (
 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
 ) : (
 <Square className="h-3 w-3 mr-1" />
 )}
 Cancel
 </Button>
 )}
 {currentExecution && !isRunning && (
 <Button
 size="sm"
 variant="ghost"
 onClick={() => clearExecution(currentExecution.id)}
 className="h-6 px-2 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-200"
 >
 <RotateCcw className="h-3 w-3 mr-1" />
 Clear
 </Button>
 )}
 
          {/* Execute Button */}
 <Button
 size="sm"
 onClick={handleExecute}
 disabled={isExecuting || isRunning || workflowId === 'new'}
 className="h-6 px-3 text-xs bg-brand-500 hover:bg-brand-600 text-background"
 >
 {isExecuting || isRunning ? (
 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
 ) : (
 <Play className="h-3 w-3 mr-1" />
 )}
            {isExecuting || isRunning ? 'Running': 'Run'}
 </Button>
 </div>
 </div>

      {/* Content Region */}
 <div className="overflow-y-auto" style={{ height: panelHeight }}>
 {activeTab === 'output' && (
 <div className="p-4 font-mono text-xs text-foreground leading-normal">
 {currentExecution?.logs
 .filter(log => log.level === 'info')
 .map((log, idx) => (
 <div 
 key={log.id} 
 className="py-1.5 leading-normal font-normal border-b border-border/70 last:border-0 animate-fade-in"
 style={{ animationDelay: `${idx * 30}ms` }}
 >
 <span className="text-foreground-muted mr-2">[{formatTime(log.timestamp)}]</span>
 <span className="text-foreground">{log.message}</span>
 </div>
 ))
 }
 {(!currentExecution || currentExecution.logs.filter(l => l.level === 'info').length === 0) && (
 <div className="flex flex-col items-center justify-center h-full py-8 text-center">
 <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3">
 <Terminal className="h-5 w-5 text-foreground-muted/50" />
 </div>
 <p className="text-sm font-medium text-foreground-muted">Run workflow to view output</p>
 <p className="text-xs text-foreground-muted/70 mt-1">Output content will be displayed here.</p>
 </div>
 )}
 <div ref={logEndRef} />
 </div>
 )}

 {activeTab === 'logs' && (
 logs.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full py-8 text-center">
 <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3">
 <Zap className="h-5 w-5 text-foreground-muted/50" />
 </div>
 <p className="text-sm font-medium text-foreground-muted">No Logs</p>
 <p className="text-xs text-foreground-muted/70 mt-1">Runtime logs will be displayed here.</p>
 </div>
 ) : (
 <VirtualScrollArea
 className="h-full font-mono text-xs"
 itemCount={logs.length}
 itemHeight={logRowHeight}
 height={logViewportHeight}
 overscan={6}
 renderItem={(index) => {
 const log = logs[index];
 if (!log) return null;
 return (
 <div
 className={cn(
 'flex items-center gap-2 px-2.5 rounded-md transition-colors h-8',
 log.level === 'error' && 'bg-destructive-200 hover:bg-destructive-200/70',
 log.level === 'warn' && 'bg-warning-200 hover:bg-warning-200/80',
 log.level === 'info' && 'hover:bg-surface-200/40',
 log.level === 'debug' && 'hover:bg-surface-200/30 opacity-60',
 )}
 >
 <span className="shrink-0">{getLogIcon(log.level)}</span>
 <span className="text-foreground-muted shrink-0 tabular-nums">
 {formatTime(log.timestamp)}
 </span>
 <span
 className={cn(
 'flex-1 truncate font-normal',
 log.level === 'error' && 'text-destructive',
 log.level === 'warn' && 'text-warning',
 log.level === 'info' && 'text-foreground',
 log.level === 'debug' && 'text-foreground-muted',
 )}
 title={log.message}
 >
 {log.message}
 </span>
 </div>
 );
 }}
 />
 )
 )}

 {activeTab === 'variables' && (
 <div className="p-3 font-mono text-xs">
 {currentExecution?.nodes && Object.keys(currentExecution.nodes).length > 0 ? (
 <div className="space-y-3">
 {Object.entries(currentExecution.nodes).map(([nodeId, nodeData], idx) => (
 <div 
 key={nodeId} 
 className="rounded-lg border border-border/70 overflow-hidden animate-fade-in"
 style={{ animationDelay: `${idx * 50}ms` }}
 >
                  {/* Node Header */}
 <div className="flex items-center justify-between px-3 py-2 bg-surface-100/80">
 <span className="text-foreground font-medium truncate">{nodeId}</span>
 <span className={cn(
 "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
 nodeData.status === 'completed' && "bg-brand-200/60 text-brand-500",
 nodeData.status === 'running' && "bg-brand-200/40 text-brand-500",
 nodeData.status === 'failed' && "bg-destructive-200 text-destructive",
 nodeData.status === 'pending' && "bg-surface-200 text-foreground-muted"
 )}>
 {nodeData.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
 {nodeData.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
 {nodeData.status === 'failed' && <XCircle className="w-2.5 h-2.5" />}
 {nodeData.status}
 </span>
 </div>
                  {/* Node Output */}
 {nodeData.outputs && (
 <pre className="p-3 overflow-x-auto text-foreground bg-surface-200 text-[11px] leading-normal font-normal">
 {JSON.stringify(nodeData.outputs, null, 2)}
 </pre>
 )}
                  {/* Error Info */}
 {nodeData.error && (
 <div className="p-3 bg-destructive-200 text-destructive border-t border-destructive/30">
 {nodeData.error}
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full py-8 text-center">
 <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3">
 <Variable className="h-5 w-5 text-foreground-muted/50" />
 </div>
 <p className="text-sm font-medium text-foreground-muted">No variable data</p>
 <p className="text-xs text-foreground-muted/70 mt-1">Node execution data will be displayed here.</p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}

export default ExecutionPanel;
