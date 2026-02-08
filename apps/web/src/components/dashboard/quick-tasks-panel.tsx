"use client";

/**
 * QuickTaskPanel - Manus Style

 * Displays todo tasks, in-progress tasks, and quick actions
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
 CheckCircle2,

 Circle,

 Clock,

 Zap,

 MessageSquare,

 Bot,

 Calendar,

 ChevronRight,

 Plus,

 Play,

 Pause,

 MoreHorizontal,

 Trash2,

 Edit3,

 Star,

 AlertCircle,

 ArrowRight,

 Sparkles,

 Target,

 Flag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,

 DropdownMenuContent,

 DropdownMenuItem,

 DropdownMenuTrigger,

 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Task priority

type Priority = "high" | "medium" | "low";

type TaskStatus = "todo" | "in_progress" | "completed";

type TaskType = "workflow" | "conversation" | "agent" | "general";

interface Task {
 id: string;

 title: string;

 description?: string;

 type: TaskType;

 status: TaskStatus;

 priority: Priority;

 dueDate?: string;

 progress?: number;

 starred?: boolean;
}

// Mock task data

const mockTasks: Task[] = [

 {
 id: "1",

   title: "Complete customer feedback workflow configuration",

   description: "Configure AI node and email notifications",

 type: "workflow",

 status: "in_progress",

 priority: "high",

 progress: 65,

 starred: true,

 },

 {
 id: "2",

   title: "Test email assistant agent",

   description: "Verify auto-reply features",

 type: "agent",

 status: "todo",

 priority: "high",

 dueDate: "Today",

 },

 {
 id: "3",

   title: "Analyze this week's sales data",

 type: "conversation",

 status: "todo",

 priority: "medium",

 dueDate: "Tomorrow",

 },

 {
 id: "4",

 title: "Update API Document",

 type: "general",

 status: "todo",

 priority: "low",

   dueDate: "This week",

 },

 {
 id: "5",

 title: "GitHub Issue CategoryFlow",

 type: "workflow",

 status: "completed",

 priority: "medium",

 starred: true,

 },

];

// Get task type info

const getTaskTypeInfo = (type: TaskType) => {
 switch (type) {
 case "workflow":

 return { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", label: "Workflow" };

 case "conversation":

 return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", label: "Conversation" };

 case "agent":

 return { icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10", label: "Agent" };

 default:

 return { icon: Target, color: "text-muted-foreground", bg: "bg-muted/50", label: "Task" };

 }
};

// Get priority info

const getPriorityInfo = (priority: Priority) => {
 switch (priority) {
 case "high":

 return { color: "text-red-400", bg: "bg-red-500/10", label: "" };

 case "medium":

 return { color: "text-amber-400", bg: "bg-amber-500/10", label: "" };

 case "low":

 return { color: "text-green-400", bg: "bg-green-500/10", label: "" };

 }
};

interface QuickTasksPanelProps {
 className?: string;

 compact?: boolean;
}

export function QuickTasksPanel({ className, compact = false }: QuickTasksPanelProps) {
 const [tasks, setTasks] = useState(mockTasks);

 const [filter, setFilter] = useState<"all" | "todo" | "in_progress">("all");

 // Filter tasks

 const filteredTasks = tasks.filter((task) => {
 if (filter === "all") return task.status !== "completed";

 return task.status === filter;

 });

 // Update task status

 const toggleTaskStatus = (id: string) => {
 setTasks((prev) =>

 prev.map((task) => {
 if (task.id === id) {
 if (task.status === "todo") return { ...task, status: "in_progress" as TaskStatus };

 if (task.status === "in_progress") return { ...task, status: "completed" as TaskStatus };

 return { ...task, status: "todo" as TaskStatus };

 }

 return task;

 })

 );

 };

 // Delete task

 const deleteTask = (id: string) => {
 setTasks((prev) => prev.filter((task) => task.id !== id));

 };

 // Toggle favorite

 const toggleStar = (id: string) => {
 setTasks((prev) =>

 prev.map((task) =>

 task.id === id ? { ...task, starred: !task.starred } : task

 )

 );

 };

 // Statistics

 const stats = {
 todo: tasks.filter((t) => t.status === "todo").length,

 inProgress: tasks.filter((t) => t.status === "in_progress").length,

 completed: tasks.filter((t) => t.status === "completed").length,

 };

 if (compact) {
 // Compact - Used for sidebar or small card

 return (
 <div className={cn("rounded-xl bg-card border border-border overflow-hidden", className)}>

 <div className="flex items-center justify-between p-3 border-b border-border">

 <h3 className="text-sm font-medium text-foreground flex items-center gap-2">

 <Target className="w-4 h-4 text-primary" />

 Tasks

 </h3>

 <span className="text-xs text-muted-foreground">{stats.todo + stats.inProgress} </span>

 </div>

 <div className="divide-y divide-border">

 {filteredTasks.slice(0, 3).map((task) => {
 const typeInfo = getTaskTypeInfo(task.type);

 return (
 <div

 key={task.id}

 className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-all cursor-pointer group"

 onClick={() => toggleTaskStatus(task.id)}

 >

 <button className="shrink-0">

 {task.status === "completed" ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-400" />

 ) : task.status === "in_progress" ? (
 <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />

 ) : (
 <Circle className="w-4 h-4 text-muted-foreground group-hover:text-foreground/70" />

 )}

 </button>

 <div className="flex-1 min-w-0">

 <p className={cn(
 "text-sm truncate",

 task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground/80"

 )}>

 {task.title}

 </p>

 </div>

 <typeInfo.icon className={cn("w-3.5 h-3.5 shrink-0", typeInfo.color)} />

 </div>

 );

 })}

 </div>

 {filteredTasks.length > 3 && (
 <Link

 href="/dashboard/tasks"

 className="flex items-center justify-center gap-1 p-2 text-xs text-primary hover:text-primary/80 transition-colors"

 >

 View all

 <ChevronRight className="w-3 h-3" />

 </Link>

 )}

 </div>

 );

 }

 // Complete

 return (
 <div className={cn("rounded-2xl bg-card border border-border overflow-hidden", className)}>

 {/* Header */}

 <div className="flex items-center justify-between p-4 border-b border-border">

 <div className="flex items-center gap-3">

 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">

 <Target className="w-5 h-5 text-primary" />

 </div>

 <div>

       <h3 className="text-lg font-semibold text-foreground">Task Center</h3>

 <p className="text-xs text-muted-foreground">

 {stats.todo} Todo {stats.inProgress} In Progress {stats.completed} Completed

 </p>

 </div>

 </div>

 <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border-0 gap-1.5">

 <Plus className="w-4 h-4" />

 New Task

 </Button>

 </div>

 {/* Filter */}

 <div className="flex items-center gap-2 p-3 border-b border-border">

 <button

 onClick={() => setFilter("all")}

 className={cn(
 "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",

 filter === "all"

 ? "bg-muted text-foreground"

 : "text-muted-foreground hover:text-foreground hover:bg-muted/50"

 )}

 >

 All

 </button>

 <button

 onClick={() => setFilter("todo")}

 className={cn(
 "px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5",

 filter === "todo"

 ? "bg-muted text-foreground"

 : "text-muted-foreground hover:text-foreground hover:bg-muted/50"

 )}

 >

 Todo

 <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{stats.todo}</span>

 </button>

 <button

 onClick={() => setFilter("in_progress")}

 className={cn(
 "px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5",

 filter === "in_progress"

 ? "bg-muted text-foreground"

 : "text-muted-foreground hover:text-foreground hover:bg-muted/50"

 )}

 >

 In Progress

 <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{stats.inProgress}</span>

 </button>

 </div>

 {/* TaskList */}

 <div className="divide-y divide-border max-h-[400px] overflow-y-auto">

 {filteredTasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-center">

 <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">

 <CheckCircle2 className="w-6 h-6 text-emerald-400" />

 </div>

 <p className="text-sm text-muted-foreground">Great! No pending tasks</p>

       <p className="text-xs text-muted-foreground/70 mt-1">Click the button above to add a new task</p>

 </div>

 ) : (
 filteredTasks.map((task) => {
 const typeInfo = getTaskTypeInfo(task.type);

 const priorityInfo = getPriorityInfo(task.priority);

 return (
 <div

 key={task.id}

 className="p-4 hover:bg-muted/50 transition-all group"

 >

 <div className="flex items-start gap-3">

 {/* Status Button */}

 <button

 onClick={() => toggleTaskStatus(task.id)}

 className="mt-0.5 shrink-0"

 >

 {task.status === "completed" ? (
 <CheckCircle2 className="w-5 h-5 text-emerald-400" />

 ) : task.status === "in_progress" ? (
 <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />

 ) : (
 <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground/70 transition-colors" />

 )}

 </button>

 {/* Content */}

 <div className="flex-1 min-w-0">

 <div className="flex items-center gap-2 mb-1">

 <p className={cn(
 "text-sm font-medium",

 task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"

 )}>

 {task.title}

 </p>

 {task.starred && (
 <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />

 )}

 </div>

 {task.description && (
 <p className="text-xs text-muted-foreground mb-2">{task.description}</p>

 )}

 {/* Tags and Info */}

 <div className="flex items-center gap-2 flex-wrap">

 {/* Type Tags */}

 <span className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",

 typeInfo.bg, typeInfo.color

 )}>

 <typeInfo.icon className="w-3 h-3" />

 {typeInfo.label}

 </span>

 {/* Priority */}

 {task.priority === "high" && (
 <span className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",

 priorityInfo.bg, priorityInfo.color

 )}>

 <Flag className="w-3 h-3" />

 Priority

 </span>

 )}

 {/* Due Date */}

 {task.dueDate && (
 <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">

 <Calendar className="w-3 h-3" />

 {task.dueDate}

 </span>

 )}

 {/* Progress Bar */}

 {task.progress !== undefined && task.status === "in_progress" && (
 <div className="flex items-center gap-2">

 <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">

 <div

 className="h-full bg-primary rounded-full transition-all"

 style={{ width: `${task.progress}%` }}

 />

 </div>

 <span className="text-[10px] text-muted-foreground">{task.progress}%</span>

 </div>

 )}

 </div>

 </div>

 {/* Action Menu */}

 <DropdownMenu>

 <DropdownMenuTrigger asChild>

 <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 opacity-0 group-hover:opacity-100 transition-all">

 <MoreHorizontal className="w-4 h-4" />

 </button>

 </DropdownMenuTrigger>

 <DropdownMenuContent align="end" className="w-40 bg-card border-border">

 <DropdownMenuItem className="text-foreground/80 focus:bg-muted focus:text-foreground gap-2">

 <Edit3 className="w-4 h-4" />

 Edit

 </DropdownMenuItem>

 <DropdownMenuItem

 className="text-foreground/80 focus:bg-muted focus:text-foreground gap-2"

 onClick={() => toggleStar(task.id)}

 >

 <Star className="w-4 h-4" />

 {task.starred ? "Unfavorite": "Favorite"}

 </DropdownMenuItem>

 {task.status !== "completed" && (
 <DropdownMenuItem

 className="text-foreground/80 focus:bg-muted focus:text-foreground gap-2"

 onClick={() => {
 setTasks((prev) =>

 prev.map((t) =>

 t.id === task.id ? { ...t, status: "completed" as TaskStatus } : t

 )

 );

 }}

 >

 <CheckCircle2 className="w-4 h-4" />

 Mark as Done

 </DropdownMenuItem>

 )}

 <DropdownMenuSeparator className="bg-border" />

 <DropdownMenuItem

 className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2"

 onClick={() => deleteTask(task.id)}

 >

 <Trash2 className="w-4 h-4" />

 Delete

 </DropdownMenuItem>

 </DropdownMenuContent>

 </DropdownMenu>

 </div>

 </div>

 );

 })

 )}

 </div>

 {/* Footer Shortcut */}

 <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">

 <div className="flex items-center gap-2">

 <Sparkles className="w-4 h-4 text-primary" />

 <span className="text-xs text-muted-foreground">AI can help you plan and track tasks</span>

 </div>

 <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">

 More

 <ArrowRight className="w-3 h-3" />

 </button>

 </div>

 </div>

 );
}

