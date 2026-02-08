"use client";

/**
 * Support Channel and Dispatch Rule Config - Supabase Style
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
 CheckCircle2,
 Bell,
 Inbox,
 LifeBuoy,
 RefreshCw,
 Settings,
 SlidersHorizontal,
 Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
 supportApi,
 type SupportAssignmentRule,
 type SupportChannel,
 type SupportNotificationTemplateConfig,
 type SupportNotificationTemplates,
 type SupportQueue,
 type SupportQueueMember,
 type SupportTeam,
 type SupportTeamMember,
} from "@/lib/api/support";

const priorityOptions = [
 { id: "", label: "No limit" },
 { id: "critical", label: "Urgent" },
 { id: "high", label: "High" },
 { id: "normal", label: "Normal" },
 { id: "low", label: "Low" },
];

const categoryOptions = [
 { id: "", label: "No limit" },
 { id: "general", label: "General Inquiry" },
 { id: "technical", label: "Technical Issue" },
 { id: "billing", label: "Billing and Quota" },
 { id: "account", label: "Account and Permission" },
 { id: "security", label: "Security and Compliance" },
 { id: "bug", label: "Bug Report" },
 { id: "feature", label: "Feature Suggestion" },
];

const channelOptions = [
 { id: "", label: "No limit" },
 { id: "web", label: "Web" },
 { id: "email", label: "Email" },
 { id: "chat", label: "Live Chat" },
 { id: "phone", label: "Phone" },
];

const assigneeOptions = [
 { id: "team", label: "Team" },
 { id: "user", label: "Person" },
 { id: "queue", label: "Queue" },
];

const emptyChannelForm = {
 key: "",
 name: "",
 description: "",
 contact: "",
 slaOverrides: {
 critical: 0,
 high: 0,
 normal: 0,
 low: 0,
 },
 enabled: true,
 sortOrder: 0,
};

const emptyRuleForm = {
 name: "",
 priority: "",
 category: "",
 channel: "",
 keyword: "",
 assigneeType: "team",
 assigneeValue: "",
 enabled: true,
 sortOrder: 0,
};

const emptyTeamForm = {
 name: "",
 description: "",
 enabled: true,
};

const emptyQueueForm = {
 name: "",
 description: "",
 enabled: true,
};

const templateChannelOptions = [
 { id: "system", label: "In-app" },
 { id: "email", label: "Email" },
 { id: "sms", label: "SMS" },
];

const templateLocaleOptions = [
 { id: "zh-CN", label: "Chinese" },
 { id: "en-US", label: "English" },
];

const defaultZhTemplates: SupportNotificationTemplates = {
 ticket_created: {
 title: "New ticket assigned",
 content: "Ticket {{reference}} has been created and assigned to you: {{subject}}",
 },
 status_updated: {
 title: "Ticket status updated",
 content: "Ticket {{reference}} status updated to {{status}}. {{note}}",
 },
 comment_added: {
 title: "New ticket comment",
 content: "Ticket {{reference}} has a new comment: {{comment}}",
 },
};

const defaultEnTemplates: SupportNotificationTemplates = {
 ticket_created: {
 title: "New ticket assigned",
 content: "Ticket {{reference}} assigned to you: {{subject}}",
 },
 status_updated: {
 title: "Ticket status updated",
 content: "Ticket {{reference}} status updated to {{status}}. {{note}}",
 },
 comment_added: {
 title: "New ticket comment",
 content: "Ticket {{reference}} has a new comment: {{comment}}",
 },
};

const defaultTemplateConfig: SupportNotificationTemplateConfig = {
 default_channel: "system",
 default_locale: "zh-CN",
 channels: {
 system: {
 "zh-CN": defaultZhTemplates,
 "en-US": defaultEnTemplates,
 },
 email: {
 "zh-CN": defaultZhTemplates,
 "en-US": defaultEnTemplates,
 },
 sms: {
 "zh-CN": defaultZhTemplates,
 "en-US": defaultEnTemplates,
 },
 },
};

const mergeTemplateConfig = (input?: SupportNotificationTemplateConfig) => {
 const base = JSON.parse(JSON.stringify(defaultTemplateConfig)) as SupportNotificationTemplateConfig;
 if (!input) {
 return base;
 }
 const merged: SupportNotificationTemplateConfig = {
 default_channel: input.default_channel || base.default_channel,
 default_locale: input.default_locale || base.default_locale,
 channels: { ...base.channels },
 };
 Object.entries(input.channels ?? {}).forEach(([channel, locales]) => {
 if (!merged.channels[channel]) {
 merged.channels[channel] = {};
 }
 Object.entries(locales ?? {}).forEach(([localeKey, templates]) => {
 merged.channels[channel][localeKey] = templates;
 });
 });
 return merged;
};

const getTemplatesForConfig = (
 config: SupportNotificationTemplateConfig,
 channel: string,
 locale: string
) => {
 return (
 config.channels?.[channel]?.[locale] ||
 config.channels?.[channel]?.[config.default_locale] ||
 config.channels?.[config.default_channel]?.[locale] ||
 config.channels?.[config.default_channel]?.[config.default_locale] ||
 defaultZhTemplates
 );
};

export default function SupportSettingsPage() {
 const [channels, setChannels] = useState<SupportChannel[]>([]);
 const [rules, setRules] = useState<SupportAssignmentRule[]>([]);
 const [teams, setTeams] = useState<SupportTeam[]>([]);
 const [queues, setQueues] = useState<SupportQueue[]>([]);
 const [teamMembers, setTeamMembers] = useState<Record<string, SupportTeamMember[]>>({});
 const [queueMembers, setQueueMembers] = useState<Record<string, SupportQueueMember[]>>({});
 const [loading, setLoading] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const [channelForm, setChannelForm] = useState({ ...emptyChannelForm });
 const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
 const [channelSubmitting, setChannelSubmitting] = useState(false);

 const [ruleForm, setRuleForm] = useState({ ...emptyRuleForm });
 const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
 const [ruleSubmitting, setRuleSubmitting] = useState(false);

 const [teamForm, setTeamForm] = useState({ ...emptyTeamForm });
 const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
 const [teamSubmitting, setTeamSubmitting] = useState(false);
 const [teamMemberDrafts, setTeamMemberDrafts] = useState<
 Record<string, { userId: string; role: string; sortOrder: number }>
 >({});

 const [queueForm, setQueueForm] = useState({ ...emptyQueueForm });
 const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
 const [queueSubmitting, setQueueSubmitting] = useState(false);
 const [queueMemberDrafts, setQueueMemberDrafts] = useState<
 Record<string, { userId: string; sortOrder: number }>
 >({});

 const [templateConfig, setTemplateConfig] = useState<SupportNotificationTemplateConfig>(
 mergeTemplateConfig()
 );
 const [activeTemplateChannel, setActiveTemplateChannel] = useState("system");
 const [activeTemplateLocale, setActiveTemplateLocale] = useState("zh-CN");
 const [templateSubmitting, setTemplateSubmitting] = useState(false);

 const loadSettings = useCallback(async () => {
 setLoading(true);
 setErrorMessage(null);
 try {
 const [channelRes, ruleRes, teamRes, queueRes, templateRes] = await Promise.all([
 supportApi.adminListChannels(true),
 supportApi.adminListRules(true),
 supportApi.adminListTeams(true),
 supportApi.adminListQueues(true),
 supportApi.adminGetNotificationTemplates(),
 ]);
 const nextChannels = channelRes.channels ?? [];
 const nextRules = ruleRes.rules ?? [];
 const nextTeams = teamRes.teams ?? [];
 const nextQueues = queueRes.queues ?? [];
 setChannels(nextChannels);
 setRules(nextRules);
 setTeams(nextTeams);
 setQueues(nextQueues);
 const mergedTemplateConfig = mergeTemplateConfig(templateRes.templates);
 setTemplateConfig(mergedTemplateConfig);
 setActiveTemplateChannel(mergedTemplateConfig.default_channel || "system");
 setActiveTemplateLocale(mergedTemplateConfig.default_locale || "zh-CN");

 const teamMemberEntries = await Promise.all(
 nextTeams.map(async (team) => {
 const res = await supportApi.adminListTeamMembers(team.id);
 return [team.id, res.members ?? []] as const;
 })
 );
 const queueMemberEntries = await Promise.all(
 nextQueues.map(async (queue) => {
 const res = await supportApi.adminListQueueMembers(queue.id);
 return [queue.id, res.members ?? []] as const;
 })
 );
 setTeamMembers(Object.fromEntries(teamMemberEntries));
 setQueueMembers(Object.fromEntries(queueMemberEntries));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to load");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 loadSettings();
 }, [loadSettings]);

 const resetChannelForm = () => {
 setChannelForm({ ...emptyChannelForm });
 setEditingChannelId(null);
 };

 const resetRuleForm = () => {
 setRuleForm({ ...emptyRuleForm });
 setEditingRuleId(null);
 };

 const resetTeamForm = () => {
 setTeamForm({ ...emptyTeamForm });
 setEditingTeamId(null);
 };

 const resetQueueForm = () => {
 setQueueForm({ ...emptyQueueForm });
 setEditingQueueId(null);
 };

 const submitChannel = async () => {
 if (!channelForm.key.trim() || !channelForm.name.trim()) {
 setErrorMessage("Please fill in Channel Key and Name");
 return;
 }
 setChannelSubmitting(true);
 setErrorMessage(null);
 try {
 const slaOverrides: Record<string, number> = {};
 Object.entries(channelForm.slaOverrides).forEach(([key, value]) => {
 if (value && value > 0) {
 slaOverrides[key] = value;
 }
 });
 if (editingChannelId) {
 const response = await supportApi.adminUpdateChannel(editingChannelId, {
 key: channelForm.key,
 name: channelForm.name,
 description: channelForm.description || undefined,
 contact: channelForm.contact || undefined,
 sla_overrides: Object.keys(slaOverrides).length ? slaOverrides : undefined,
 enabled: channelForm.enabled,
 sort_order: channelForm.sortOrder,
 });
 setChannels((prev) =>
 prev.map((item) => (item.id === editingChannelId ? response.channel : item))
 );
 } else {
 const response = await supportApi.adminCreateChannel({
 key: channelForm.key,
 name: channelForm.name,
 description: channelForm.description || undefined,
 contact: channelForm.contact || undefined,
 sla_overrides: Object.keys(slaOverrides).length ? slaOverrides : undefined,
 enabled: channelForm.enabled,
 sort_order: channelForm.sortOrder,
 });
 setChannels((prev) => [response.channel, ...prev]);
 }
 resetChannelForm();
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to save channel");
 } finally {
 setChannelSubmitting(false);
 }
 };

 const editChannel = (channel: SupportChannel) => {
 setEditingChannelId(channel.id);
 setChannelForm({
 key: channel.key,
 name: channel.name,
 description: channel.description || "",
 contact: channel.contact || "",
 slaOverrides: {
 critical: channel.sla_overrides?.critical || 0,
 high: channel.sla_overrides?.high || 0,
 normal: channel.sla_overrides?.normal || 0,
 low: channel.sla_overrides?.low || 0,
 },
 enabled: channel.enabled,
 sortOrder: channel.sort_order || 0,
 });
 };

 const toggleChannel = async (channel: SupportChannel) => {
 try {
 const response = await supportApi.adminUpdateChannel(channel.id, {
 enabled: !channel.enabled,
 });
 setChannels((prev) =>
 prev.map((item) => (item.id === channel.id ? response.channel : item))
 );
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to update channel");
 }
 };

 const submitRule = async () => {
 if (!ruleForm.name.trim()) {
 setErrorMessage("Please fill in Rule Name");
 return;
 }
 setRuleSubmitting(true);
 setErrorMessage(null);
 try {
 if (editingRuleId) {
 const response = await supportApi.adminUpdateRule(editingRuleId, {
 name: ruleForm.name,
 priority: ruleForm.priority || undefined,
 category: ruleForm.category || undefined,
 channel: ruleForm.channel || undefined,
 keyword: ruleForm.keyword || undefined,
 assignee_type: ruleForm.assigneeType,
 assignee_value: ruleForm.assigneeValue,
 enabled: ruleForm.enabled,
 sort_order: ruleForm.sortOrder,
 });
 setRules((prev) =>
 prev.map((item) => (item.id === editingRuleId ? response.rule : item))
 );
 } else {
 const response = await supportApi.adminCreateRule({
 name: ruleForm.name,
 priority: ruleForm.priority || undefined,
 category: ruleForm.category || undefined,
 channel: ruleForm.channel || undefined,
 keyword: ruleForm.keyword || undefined,
 assignee_type: ruleForm.assigneeType,
 assignee_value: ruleForm.assigneeValue,
 enabled: ruleForm.enabled,
 sort_order: ruleForm.sortOrder,
 });
 setRules((prev) => [response.rule, ...prev]);
 }
 resetRuleForm();
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to save rule");
 } finally {
 setRuleSubmitting(false);
 }
 };

 const editRule = (rule: SupportAssignmentRule) => {
 setEditingRuleId(rule.id);
 setRuleForm({
 name: rule.name,
 priority: rule.priority || "",
 category: rule.category || "",
 channel: rule.channel || "",
 keyword: rule.keyword || "",
 assigneeType: rule.assignee_type || "team",
 assigneeValue: rule.assignee_value || "",
 enabled: rule.enabled,
 sortOrder: rule.sort_order || 0,
 });
 };

 const toggleRule = async (rule: SupportAssignmentRule) => {
 try {
 const response = await supportApi.adminUpdateRule(rule.id, {
 enabled: !rule.enabled,
 });
 setRules((prev) =>
 prev.map((item) => (item.id === rule.id ? response.rule : item))
 );
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to update rule");
 }
 };

 const submitTeam = async () => {
 if (!teamForm.name.trim()) {
 setErrorMessage("Please fill in Team Name");
 return;
 }
 setTeamSubmitting(true);
 setErrorMessage(null);
 try {
 if (editingTeamId) {
 const response = await supportApi.adminUpdateTeam(editingTeamId, {
 name: teamForm.name,
 description: teamForm.description || undefined,
 enabled: teamForm.enabled,
 });
 setTeams((prev) =>
 prev.map((item) => (item.id === editingTeamId ? response.team : item))
 );
 } else {
 const response = await supportApi.adminCreateTeam({
 name: teamForm.name,
 description: teamForm.description || undefined,
 enabled: teamForm.enabled,
 });
 setTeams((prev) => [response.team, ...prev]);
 }
 resetTeamForm();
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to save team");
 } finally {
 setTeamSubmitting(false);
 }
 };

 const editTeam = (team: SupportTeam) => {
 setEditingTeamId(team.id);
 setTeamForm({
 name: team.name,
 description: team.description || "",
 enabled: team.enabled,
 });
 };

 const toggleTeam = async (team: SupportTeam) => {
 try {
 const response = await supportApi.adminUpdateTeam(team.id, {
 enabled: !team.enabled,
 });
 setTeams((prev) =>
 prev.map((item) => (item.id === team.id ? response.team : item))
 );
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to update team");
 }
 };

 const addTeamMember = async (teamId: string) => {
 const draft = teamMemberDrafts[teamId];
 if (!draft?.userId) {
 setErrorMessage("Please fill in Member User ID");
 return;
 }
 try {
 const response = await supportApi.adminAddTeamMember(teamId, {
 user_id: draft.userId,
 role: draft.role || undefined,
 sort_order: draft.sortOrder || undefined,
 });
 setTeamMembers((prev) => ({
 ...prev,
 [teamId]: [...(prev[teamId] || []), response.member],
 }));
 setTeamMemberDrafts((prev) => ({
 ...prev,
 [teamId]: { userId: "", role: "", sortOrder: 0 },
 }));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to add member");
 }
 };

 const removeTeamMember = async (teamId: string, userId: string) => {
 try {
 await supportApi.adminRemoveTeamMember(teamId, userId);
 setTeamMembers((prev) => ({
 ...prev,
 [teamId]: (prev[teamId] || []).filter((member) => member.user_id !== userId),
 }));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to remove member");
 }
 };

 const submitQueue = async () => {
 if (!queueForm.name.trim()) {
 setErrorMessage("Please fill in Queue Name");
 return;
 }
 setQueueSubmitting(true);
 setErrorMessage(null);
 try {
 if (editingQueueId) {
 const response = await supportApi.adminUpdateQueue(editingQueueId, {
 name: queueForm.name,
 description: queueForm.description || undefined,
 enabled: queueForm.enabled,
 });
 setQueues((prev) =>
 prev.map((item) => (item.id === editingQueueId ? response.queue : item))
 );
 } else {
 const response = await supportApi.adminCreateQueue({
 name: queueForm.name,
 description: queueForm.description || undefined,
 enabled: queueForm.enabled,
 });
 setQueues((prev) => [response.queue, ...prev]);
 }
 resetQueueForm();
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to save queue");
 } finally {
 setQueueSubmitting(false);
 }
 };

 const editQueue = (queue: SupportQueue) => {
 setEditingQueueId(queue.id);
 setQueueForm({
 name: queue.name,
 description: queue.description || "",
 enabled: queue.enabled,
 });
 };

 const toggleQueue = async (queue: SupportQueue) => {
 try {
 const response = await supportApi.adminUpdateQueue(queue.id, {
 enabled: !queue.enabled,
 });
 setQueues((prev) =>
 prev.map((item) => (item.id === queue.id ? response.queue : item))
 );
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to update queue");
 }
 };

 const addQueueMember = async (queueId: string) => {
 const draft = queueMemberDrafts[queueId];
 if (!draft?.userId) {
 setErrorMessage("Please fill in Member User ID");
 return;
 }
 try {
 const response = await supportApi.adminAddQueueMember(queueId, {
 user_id: draft.userId,
 sort_order: draft.sortOrder || undefined,
 });
 setQueueMembers((prev) => ({
 ...prev,
 [queueId]: [...(prev[queueId] || []), response.member],
 }));
 setQueueMemberDrafts((prev) => ({
 ...prev,
 [queueId]: { userId: "", sortOrder: 0 },
 }));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to add member");
 }
 };

 const removeQueueMember = async (queueId: string, userId: string) => {
 try {
 await supportApi.adminRemoveQueueMember(queueId, userId);
 setQueueMembers((prev) => ({
 ...prev,
 [queueId]: (prev[queueId] || []).filter((member) => member.user_id !== userId),
 }));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to remove member");
 }
 };

 const submitTemplates = async () => {
 setTemplateSubmitting(true);
 setErrorMessage(null);
 try {
 const response = await supportApi.adminUpdateNotificationTemplates(templateConfig);
 setTemplateConfig(mergeTemplateConfig(response.templates));
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to save notification template");
 } finally {
 setTemplateSubmitting(false);
 }
 };

 const activeTemplates = useMemo(
 () => getTemplatesForConfig(templateConfig, activeTemplateChannel, activeTemplateLocale),
 [templateConfig, activeTemplateChannel, activeTemplateLocale]
 );

 const updateTemplateField = (
 key: keyof SupportNotificationTemplates,
 field: "title" | "content",
 value: string
 ) => {
 setTemplateConfig((prev) => {
 const next = mergeTemplateConfig(prev);
 const channelMap = { ...(next.channels[activeTemplateChannel] || {}) };
 const current = getTemplatesForConfig(next, activeTemplateChannel, activeTemplateLocale);
 channelMap[activeTemplateLocale] = {
 ...current,
 [key]: {
 ...current[key],
 [field]: value,
 },
 };
 return {
 ...next,
 channels: {
 ...next.channels,
 [activeTemplateChannel]: channelMap,
 },
 };
 });
 };

 return (
 <div className="page-section p-6">
 <div className="page-header">
 <div>
 <p className="page-caption">Support</p>
 <h1 className="page-title flex items-center gap-2">
 <Settings className="w-5 h-5 text-brand-500" />
 Support Settings
 </h1>
 <p className="page-description">Manage support channels and ticket auto-dispatch policy</p>
 </div>
 <div className="page-toolbar">
 <Button
 variant="outline"
 size="sm"
 className="h-8 border-border text-foreground-light hover:text-foreground"
 onClick={loadSettings}
 disabled={loading}
 >
 <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
 Refresh
 </Button>
 </div>
 </div>

 {errorMessage && (
 <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
 {errorMessage}
 </div>
 )}

 <div className="page-grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Support Channels</h2>
 <p className="page-panel-description">Configure external support entry and contact method</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {channels.length} Channels
 </Badge>
 </div>
 </div>
 <div className="p-5 space-y-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm font-medium text-foreground">
 <LifeBuoy className="w-4 h-4 text-brand-500" />
 {editingChannelId ? "Edit Channel" : "Add Channel"}
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <Input
 placeholder="Key (e.g. email)"
 value={channelForm.key}
 onChange={(e) => setChannelForm((prev) => ({ ...prev, key: e.target.value }))}
 />
 <Input
 placeholder="Name"
 value={channelForm.name}
 onChange={(e) => setChannelForm((prev) => ({ ...prev, name: e.target.value }))}
 />
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <Input
 placeholder="Contact method"
 value={channelForm.contact}
 onChange={(e) => setChannelForm((prev) => ({ ...prev, contact: e.target.value }))}
 />
 <Input
 placeholder="Sort order"
 type="number"
 value={channelForm.sortOrder}
 onChange={(e) =>
 setChannelForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
 }
 />
 </div>
 <div>
 <label className="text-xs font-medium text-foreground">Channel Response SLA (minutes)</label>
 <div className="grid sm:grid-cols-4 gap-3 mt-2">
 <Input
 type="number"
 placeholder="Urgent"
 value={channelForm.slaOverrides.critical}
 onChange={(e) =>
 setChannelForm((prev) => ({
 ...prev,
 slaOverrides: {
 ...prev.slaOverrides,
 critical: Number(e.target.value),
 },
 }))
 }
 />
 <Input
 type="number"
 placeholder=""
 value={channelForm.slaOverrides.high}
 onChange={(e) =>
 setChannelForm((prev) => ({
 ...prev,
 slaOverrides: {
 ...prev.slaOverrides,
 high: Number(e.target.value),
 },
 }))
 }
 />
 <Input
 type="number"
 placeholder=""
 value={channelForm.slaOverrides.normal}
 onChange={(e) =>
 setChannelForm((prev) => ({
 ...prev,
 slaOverrides: {
 ...prev.slaOverrides,
 normal: Number(e.target.value),
 },
 }))
 }
 />
 <Input
 type="number"
 placeholder=""
 value={channelForm.slaOverrides.low}
 onChange={(e) =>
 setChannelForm((prev) => ({
 ...prev,
 slaOverrides: {
 ...prev.slaOverrides,
 low: Number(e.target.value),
 },
 }))
 }
 />
 </div>
 <p className="text-xs text-foreground-muted mt-2">
                      Leave empty to use the default SLA.
 </p>
 </div>
 <Input
 placeholder="Description (optional)"
 value={channelForm.description}
 onChange={(e) =>
 setChannelForm((prev) => ({ ...prev, description: e.target.value }))
 }
 />
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Switch
 checked={channelForm.enabled}
 onCheckedChange={(checked) =>
 setChannelForm((prev) => ({ ...prev, enabled: checked }))
 }
 />
 Enable Channel
 </div>
 <div className="flex items-center gap-2">
 {editingChannelId && (
 <Button
 variant="outline"
 size="sm"
 className="border-border"
 onClick={resetChannelForm}
 >
 Cancel
 </Button>
 )}
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={submitChannel}
 disabled={channelSubmitting}
 >
 {channelSubmitting ? "Saving..." : "Save Channel"}
 </Button>
 </div>
 </div>
 </div>

 {channels.length === 0 ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
 No channel configured
 </div>
 ) : (
 <div className="space-y-3">
 {channels.map((channel) => (
 <div key={channel.id} className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-foreground">{channel.name}</span>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {channel.key}
 </Badge>
 </div>
 <p className="text-xs text-foreground-muted mt-1">{channel.contact || "No contact method specified"}</p>
 {channel.sla_overrides && (
 <p className="text-xs text-foreground-muted mt-1">
 SLA Coverage: {Object.keys(channel.sla_overrides).join(", ")}
 </p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <Switch checked={channel.enabled} onCheckedChange={() => toggleChannel(channel)} />
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => editChannel(channel)}
 >
 Edit
 </Button>
 </div>
 </div>
 {channel.description && (
 <p className="text-xs text-foreground-muted mt-2">{channel.description}</p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Auto-dispatch rules</h2>
 <p className="page-panel-description">Auto-dispatch tickets to teams by priority and channel</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {rules.length} Rules
 </Badge>
 </div>
 </div>
 <div className="p-5 space-y-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm font-medium text-foreground">
 <SlidersHorizontal className="w-4 h-4 text-brand-500" />
 {editingRuleId ? "Edit Rule" : "Add Rule"}
 </div>
 <Input
 placeholder="Rule name"
 value={ruleForm.name}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
 />
 <div className="grid sm:grid-cols-2 gap-3">
 <select
 value={ruleForm.priority}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, priority: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {priorityOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 <select
 value={ruleForm.category}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, category: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {categoryOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <select
 value={ruleForm.channel}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, channel: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {channelOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 <Input
 placeholder="Keywords (optional)"
 value={ruleForm.keyword}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, keyword: e.target.value }))}
 />
 </div>
 <div className="grid sm:grid-cols-3 gap-3">
 <select
 value={ruleForm.assigneeType}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, assigneeType: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {assigneeOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 {ruleForm.assigneeType === "team" ? (
 <select
 value={ruleForm.assigneeValue}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, assigneeValue: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 <option value="">Select Team</option>
 {teams.map((team) => (
 <option key={team.id} value={team.id}>
 {team.name}
 </option>
 ))}
 </select>
 ) : ruleForm.assigneeType === "queue" ? (
 <select
 value={ruleForm.assigneeValue}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, assigneeValue: e.target.value }))}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 <option value="">Select Queue</option>
 {queues.map((queue) => (
 <option key={queue.id} value={queue.id}>
 {queue.name}
 </option>
 ))}
 </select>
 ) : (
 <Input
 placeholder="User ID"
 value={ruleForm.assigneeValue}
 onChange={(e) => setRuleForm((prev) => ({ ...prev, assigneeValue: e.target.value }))}
 />
 )}
 <Input
 placeholder="Sort"
 type="number"
 value={ruleForm.sortOrder}
 onChange={(e) =>
 setRuleForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
 }
 />
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Switch
 checked={ruleForm.enabled}
 onCheckedChange={(checked) =>
 setRuleForm((prev) => ({ ...prev, enabled: checked }))
 }
 />
 Enable Rule
 </div>
 <div className="flex items-center gap-2">
 {editingRuleId && (
 <Button
 variant="outline"
 size="sm"
 className="border-border"
 onClick={resetRuleForm}
 >
 Cancel
 </Button>
 )}
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={submitRule}
 disabled={ruleSubmitting}
 >
 {ruleSubmitting ? "Saving..." : "Save Rule"}
 </Button>
 </div>
 </div>
 </div>

 {rules.length === 0 ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
 No dispatch rules
 </div>
 ) : (
 <div className="space-y-3">
 {rules.map((rule) => (
 <div key={rule.id} className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-foreground">{rule.name}</span>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {rule.assignee_type || "team"} · {rule.assignee_value || "Not configured"}
 </Badge>
 </div>
 <p className="text-xs text-foreground-muted mt-1">
 {rule.priority || "No limit"} / {rule.category || "No limit"} / {rule.channel || "No limit"} / {rule.keyword || "No keywords"}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule)} />
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => editRule(rule)}
 >
 Edit
 </Button>
 </div>
 </div>
 <div className="mt-2 text-xs text-foreground-muted flex items-center gap-2">
 <CheckCircle2 className="w-3.5 h-3.5" />
 Sort: {rule.sort_order || 0}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="page-grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 mt-6">
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Support Teams</h2>
 <p className="page-panel-description">Configure team and member mapping</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {teams.length} Teams
 </Badge>
 </div>
 </div>
 <div className="p-5 space-y-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm font-medium text-foreground">
 <Users className="w-4 h-4 text-brand-500" />
 {editingTeamId ? "Edit Team" : "Add Team"}
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <Input
 placeholder="Team name"
 value={teamForm.name}
 onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
 />
 <Input
 placeholder="Description (optional)"
 value={teamForm.description}
 onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))}
 />
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Switch
 checked={teamForm.enabled}
 onCheckedChange={(checked) => setTeamForm((prev) => ({ ...prev, enabled: checked }))}
 />
 Enable Team
 </div>
 <div className="flex items-center gap-2">
 {editingTeamId && (
 <Button
 variant="outline"
 size="sm"
 className="border-border"
 onClick={resetTeamForm}
 >
 Cancel
 </Button>
 )}
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={submitTeam}
 disabled={teamSubmitting}
 >
 {teamSubmitting ? "Saving..." : "Save Team"}
 </Button>
 </div>
 </div>
 </div>

 {teams.length === 0 ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
 No teams
 </div>
 ) : (
 <div className="space-y-3">
 {teams.map((team) => {
 const members = teamMembers[team.id] || [];
 const draft = teamMemberDrafts[team.id] || { userId: "", role: "", sortOrder: 0 };
 return (
 <div key={team.id} className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-sm font-medium text-foreground">{team.name}</div>
 {team.description && (
 <p className="text-xs text-foreground-muted mt-1">{team.description}</p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <Switch checked={team.enabled} onCheckedChange={() => toggleTeam(team)} />
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => editTeam(team)}
 >
 Edit
 </Button>
 </div>
 </div>
 <div className="grid sm:grid-cols-3 gap-3">
 <Input
 placeholder="Member user ID"
 value={draft.userId}
 onChange={(e) =>
 setTeamMemberDrafts((prev) => ({
 ...prev,
 [team.id]: { ...draft, userId: e.target.value },
 }))
 }
 />
 <Input
 placeholder="Role (optional)"
 value={draft.role}
 onChange={(e) =>
 setTeamMemberDrafts((prev) => ({
 ...prev,
 [team.id]: { ...draft, role: e.target.value },
 }))
 }
 />
 <div className="flex items-center gap-2">
 <Input
 placeholder="Sort"
 type="number"
 value={draft.sortOrder}
 onChange={(e) =>
 setTeamMemberDrafts((prev) => ({
 ...prev,
 [team.id]: { ...draft, sortOrder: Number(e.target.value) },
 }))
 }
 />
 <Button size="sm" variant="outline" onClick={() => addTeamMember(team.id)}>
 Add
 </Button>
 </div>
 </div>
 {members.length > 0 && (
 <div className="flex flex-wrap gap-2 text-xs">
 {members.map((member) => (
 <span
 key={member.id}
 className="inline-flex items-center gap-2 rounded-full bg-surface-200 px-3 py-1 text-foreground-muted"
 >
 {member.user_id}
 <button
 type="button"
 onClick={() => removeTeamMember(team.id, member.user_id)}
 className="text-foreground-muted hover:text-foreground"
 >
 ×
 </button>
 </span>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Support Queues</h2>
 <p className="page-panel-description">Tickets are dispatched to queue members.</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {queues.length} Queues
 </Badge>
 </div>
 </div>
 <div className="p-5 space-y-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm font-medium text-foreground">
 <Inbox className="w-4 h-4 text-brand-500" />
 {editingQueueId ? "Edit Queue" : "Add Queue"}
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <Input
 placeholder="Queue name"
 value={queueForm.name}
 onChange={(e) => setQueueForm((prev) => ({ ...prev, name: e.target.value }))}
 />
 <Input
 placeholder="Description (optional)"
 value={queueForm.description}
 onChange={(e) => setQueueForm((prev) => ({ ...prev, description: e.target.value }))}
 />
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Switch
 checked={queueForm.enabled}
 onCheckedChange={(checked) => setQueueForm((prev) => ({ ...prev, enabled: checked }))}
 />
 Enable Queue
 </div>
 <div className="flex items-center gap-2">
 {editingQueueId && (
 <Button
 variant="outline"
 size="sm"
 className="border-border"
 onClick={resetQueueForm}
 >
 Cancel
 </Button>
 )}
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={submitQueue}
 disabled={queueSubmitting}
 >
 {queueSubmitting ? "Saving..." : "Save Queue"}
 </Button>
 </div>
 </div>
 </div>

 {queues.length === 0 ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
 No queues
 </div>
 ) : (
 <div className="space-y-3">
 {queues.map((queue) => {
 const members = queueMembers[queue.id] || [];
 const draft = queueMemberDrafts[queue.id] || { userId: "", sortOrder: 0 };
 return (
 <div key={queue.id} className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-sm font-medium text-foreground">{queue.name}</div>
 {queue.description && (
 <p className="text-xs text-foreground-muted mt-1">{queue.description}</p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <Switch checked={queue.enabled} onCheckedChange={() => toggleQueue(queue)} />
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => editQueue(queue)}
 >
 Edit
 </Button>
 </div>
 </div>
 <div className="grid sm:grid-cols-3 gap-3">
 <Input
 placeholder="Member user ID"
 value={draft.userId}
 onChange={(e) =>
 setQueueMemberDrafts((prev) => ({
 ...prev,
 [queue.id]: { ...draft, userId: e.target.value },
 }))
 }
 />
 <Input
 placeholder="Sort"
 type="number"
 value={draft.sortOrder}
 onChange={(e) =>
 setQueueMemberDrafts((prev) => ({
 ...prev,
 [queue.id]: { ...draft, sortOrder: Number(e.target.value) },
 }))
 }
 />
 <Button size="sm" variant="outline" onClick={() => addQueueMember(queue.id)}>
 Add
 </Button>
 </div>
 {members.length > 0 && (
 <div className="flex flex-wrap gap-2 text-xs">
 {members.map((member) => (
 <span
 key={member.id}
 className="inline-flex items-center gap-2 rounded-full bg-surface-200 px-3 py-1 text-foreground-muted"
 >
 {member.user_id}
 <button
 type="button"
 onClick={() => removeQueueMember(queue.id, member.user_id)}
 className="text-foreground-muted hover:text-foreground"
 >
 ×
 </button>
 </span>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="page-panel mt-6">
 <div className="page-panel-header">
 <div className="flex items-center gap-2">
 <Bell className="w-4 h-4 text-brand-500" />
 <h2 className="page-panel-title">Notification Templates</h2>
 </div>
 <p className="page-panel-description">Configure ticket notification title and content template</p>
 </div>
 <div className="p-5 space-y-4">
 <div className="grid lg:grid-cols-2 gap-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-2">
 <div className="text-xs font-medium text-foreground">Default send policy</div>
 <div className="grid sm:grid-cols-2 gap-3">
 <select
 value={templateConfig.default_channel}
 onChange={(e) =>
 setTemplateConfig((prev) => ({ ...prev, default_channel: e.target.value }))
 }
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {templateChannelOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 <select
 value={templateConfig.default_locale}
 onChange={(e) =>
 setTemplateConfig((prev) => ({ ...prev, default_locale: e.target.value }))
 }
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {templateLocaleOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <p className="text-xs text-foreground-muted">
 When no channel or language is specified, the default configuration is used.
 </p>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-2">
 <div className="text-xs font-medium text-foreground">Edit template scope</div>
 <div className="grid sm:grid-cols-2 gap-3">
 <select
 value={activeTemplateChannel}
 onChange={(e) => setActiveTemplateChannel(e.target.value)}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {templateChannelOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 <select
 value={activeTemplateLocale}
 onChange={(e) => setActiveTemplateLocale(e.target.value)}
 className="h-9 rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {templateLocaleOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <p className="text-xs text-foreground-muted">
 Only update current channel and language template content.
 </p>
 </div>
 </div>
 <div className="text-xs text-foreground-muted">
 Available variables: {"{{reference}}"}, {"{{subject}}"}, {"{{status}}"}, {"{{note}}"}, {"{{comment}}"}, {"{{assignee}}"}
 </div>
 <div className="grid lg:grid-cols-3 gap-4">
 {(
 [
 { key: "ticket_created", label: "Ticket Created" },
 { key: "status_updated", label: "Status Updated" },
 { key: "comment_added", label: "Comment Added" },
 ] as const
 ).map((item) => (
 <div key={item.key} className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="text-sm font-medium text-foreground">{item.label}</div>
 <Input
 placeholder="Title template"
 value={activeTemplates[item.key].title}
 onChange={(e) => updateTemplateField(item.key, "title", e.target.value)}
 />
 <textarea
 rows={4}
 placeholder="Content template"
 value={activeTemplates[item.key].content}
 onChange={(e) => updateTemplateField(item.key, "content", e.target.value)}
 className="w-full rounded-md border border-border bg-surface-200 px-3 py-2 text-sm text-foreground resize-none"
 />
 </div>
 ))}
 </div>
 <div className="flex justify-end">
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={submitTemplates}
 disabled={templateSubmitting}
 >
 {templateSubmitting ? "Saving..." : "Save Template"}
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
