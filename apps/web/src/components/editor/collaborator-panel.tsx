"use client";

import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export interface Collaborator {
 id: string;
 username: string;
 avatar_url?: string;
 color: string;
 is_online: boolean;
 cursor?: { x: number; y: number };
 selection?: string[];
 joined_at?: string;
}

interface CollaboratorPanelProps {
 workflowId: string;
 maxDisplay?: number;
}

// GenerateUserColor(Based onUser ID)
const getUserColor = (userId: string) => {
 const colors = [
 "var(--color-brand-500)",
 "var(--color-brand-600)",
 "var(--color-brand-400)",
 "var(--color-brand-300)",
 "var(--color-warning)",
 "var(--color-warning-400)",
 "var(--color-destructive-400)",
 "var(--color-foreground-light)",
 ];
 const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
 return colors[index % colors.length];
};

export function CollaboratorPanel({
 workflowId,
 maxDisplay = 4,
}: CollaboratorPanelProps) {
 const { lastMessage, isConnected } = useWebSocketContext();
 const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

 // ProcessCollaboratorMessage
 const handleCollaboratorMessage = useCallback((message: unknown) => {
 const msg = message as {
 type: string;
 payload: {
 user_id: string;
 workflow_id: string;
 user?: {
 id: string;
 username: string;
 avatar_url?: string;
 };
 cursor?: { x: number; y: number };
 selection?: string[];
 };
 };

 if (msg.payload.workflow_id !== workflowId) return;

 switch (msg.type) {
 case "collaborator.joined":
 if (msg.payload.user) {
 const newCollaborator: Collaborator = {
 id: msg.payload.user.id,
 username: msg.payload.user.username,
 avatar_url: msg.payload.user.avatar_url,
 color: getUserColor(msg.payload.user.id),
 is_online: true,
 joined_at: new Date().toISOString(),
 };
 setCollaborators((prev) => {
 const exists = prev.find((c) => c.id === newCollaborator.id);
 if (exists) {
 return prev.map((c) =>
 c.id === newCollaborator.id ? { ...c, is_online: true } : c
 );
 }
 return [...prev, newCollaborator];
 });
 }
 break;

 case "collaborator.left":
 setCollaborators((prev) =>
 prev.map((c) =>
 c.id === msg.payload.user_id ? { ...c, is_online: false } : c
 ).filter((c) => c.is_online)
 );
 break;

 case "collaborator.cursor":
 if (msg.payload.cursor) {
 setCollaborators((prev) =>
 prev.map((c) =>
 c.id === msg.payload.user_id
 ? { ...c, cursor: msg.payload.cursor }
 : c
 )
 );
 }
 break;

 case "collaborator.selection":
 if (msg.payload.selection) {
 setCollaborators((prev) =>
 prev.map((c) =>
 c.id === msg.payload.user_id
 ? { ...c, selection: msg.payload.selection }
 : c
 )
 );
 }
 break;
 }
 }, [workflowId]);

 // Listen WebSocket Message
 useEffect(() => {
 if (lastMessage && lastMessage.type?.startsWith("collaborator.")) {
 handleCollaboratorMessage(lastMessage);
 }
 }, [lastMessage, handleCollaboratorMessage]);

 // Clean upOfflineCollaborator
 useEffect(() => {
 const cleanup = setInterval(() => {
 setCollaborators((prev) => prev.filter((c) => c.is_online));
 }, 60000); // eachminClean up1times

 return () => clearInterval(cleanup);
 }, []);

 const onlineCollaborators = collaborators.filter((c) => c.is_online);
 const displayCollaborators = onlineCollaborators.slice(0, maxDisplay);
 const remainingCount = Math.max(0, onlineCollaborators.length - maxDisplay);

 // ifresultNoOnlineCollaborator, notDisplay
 if (onlineCollaborators.length === 0) {
 return (
 <div className="flex items-center gap-2 px-2 py-1 text-xs text-foreground-muted">
 {isConnected ? (
 <>
 <span className="w-2 h-2 rounded-full bg-brand-500" />
 Connected
 </>
 ) : (
 <>
 <span className="w-2 h-2 rounded-full bg-foreground-muted" />
 Offline
 </>
 )}
 </div>
 );
 }

 return (
 <div className="flex items-center gap-1">
 <TooltipProvider>
 <div className="flex -space-x-2">
 {displayCollaborators.map((collaborator) => (
 <Tooltip key={collaborator.id}>
 <TooltipTrigger asChild>
 <div
 className="relative"
 style={{
 "--collaborator-color": collaborator.color,
 } as React.CSSProperties}
 >
 <Avatar className="w-8 h-8 border-2 border-background ring-2 ring-(--collaborator-color)">
 <AvatarImage src={collaborator.avatar_url} />
 <AvatarFallback
 style={{ backgroundColor: collaborator.color }}
 className="text-white text-xs"
 >
 {collaborator.username[0].toUpperCase()}
 </AvatarFallback>
 </Avatar>
 {/* OnlineIndicator */}
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-background rounded-full" />
 </div>
 </TooltipTrigger>
 <TooltipContent>
 <p>{collaborator.username}</p>
 <p className="text-xs text-foreground-muted">currentlyatEdit</p>
 </TooltipContent>
 </Tooltip>
 ))}
 </div>

 {remainingCount > 0 && (
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 px-2">
 +{remainingCount}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-64 bg-surface-100 border-border">
 <div className="space-y-2">
 <h4 className="font-medium text-sm">OnlineCollaborator</h4>
 <div className="space-y-2">
 {onlineCollaborators.map((collaborator) => (
 <div
 key={collaborator.id}
 className="flex items-center gap-2 p-2 rounded hover:bg-surface-200"
 >
 <Avatar className="w-6 h-6">
 <AvatarImage src={collaborator.avatar_url} />
 <AvatarFallback
 style={{ backgroundColor: collaborator.color }}
 className="text-white text-xs"
 >
 {collaborator.username[0].toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <span className="text-sm">{collaborator.username}</span>
 </div>
 ))}
 </div>
 </div>
 </PopoverContent>
 </Popover>
 )}
 </TooltipProvider>

 <span className="text-xs text-foreground-muted ml-2">
 <Users className="w-3 h-3 inline mr-1" />
 {onlineCollaborators.length} personOnline
 </span>
 </div>
 );
}
