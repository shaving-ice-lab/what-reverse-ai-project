"use client";

/**
 * 支持渠道与分派规则配置 - Supabase 风格
 */

import { useCallback, useEffect, useState } from "react";
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
  { id: "", label: "不限" },
  { id: "critical", label: "紧急" },
  { id: "high", label: "高" },
  { id: "normal", label: "中" },
  { id: "low", label: "低" },
];

const categoryOptions = [
  { id: "", label: "不限" },
  { id: "general", label: "一般咨询" },
  { id: "technical", label: "技术问题" },
  { id: "billing", label: "计费与配额" },
  { id: "account", label: "账号与权限" },
  { id: "security", label: "安全与合规" },
  { id: "bug", label: "Bug 报告" },
  { id: "feature", label: "功能建议" },
];

const channelOptions = [
  { id: "", label: "不限" },
  { id: "web", label: "Web" },
  { id: "email", label: "Email" },
  { id: "chat", label: "在线客服" },
  { id: "phone", label: "电话" },
];

const assigneeOptions = [
  { id: "team", label: "团队" },
  { id: "user", label: "个人" },
  { id: "queue", label: "队列" },
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
  { id: "system", label: "站内" },
  { id: "email", label: "邮件" },
  { id: "sms", label: "短信" },
];

const templateLocaleOptions = [
  { id: "zh-CN", label: "中文" },
  { id: "en-US", label: "English" },
];

const defaultZhTemplates: SupportNotificationTemplates = {
  ticket_created: {
    title: "新工单已分派",
    content: "工单 {{reference}} 已创建并分派给你：{{subject}}",
  },
  status_updated: {
    title: "工单状态更新",
    content: "工单 {{reference}} 状态更新为 {{status}}。{{note}}",
  },
  comment_added: {
    title: "工单新增评论",
    content: "工单 {{reference}} 有新评论：{{comment}}",
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
      setErrorMessage((error as Error).message || "加载失败");
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
      setErrorMessage("请填写渠道 Key 与名称");
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
      setErrorMessage((error as Error).message || "保存渠道失败");
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
      setErrorMessage((error as Error).message || "更新渠道失败");
    }
  };

  const submitRule = async () => {
    if (!ruleForm.name.trim()) {
      setErrorMessage("请填写规则名称");
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
      setErrorMessage((error as Error).message || "保存规则失败");
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
      setErrorMessage((error as Error).message || "更新规则失败");
    }
  };

  const submitTeam = async () => {
    if (!teamForm.name.trim()) {
      setErrorMessage("请填写团队名称");
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
      setErrorMessage((error as Error).message || "保存团队失败");
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
      setErrorMessage((error as Error).message || "更新团队失败");
    }
  };

  const addTeamMember = async (teamId: string) => {
    const draft = teamMemberDrafts[teamId];
    if (!draft?.userId) {
      setErrorMessage("请填写成员用户 ID");
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
      setErrorMessage((error as Error).message || "添加成员失败");
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
      setErrorMessage((error as Error).message || "移除成员失败");
    }
  };

  const submitQueue = async () => {
    if (!queueForm.name.trim()) {
      setErrorMessage("请填写队列名称");
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
      setErrorMessage((error as Error).message || "保存队列失败");
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
      setErrorMessage((error as Error).message || "更新队列失败");
    }
  };

  const addQueueMember = async (queueId: string) => {
    const draft = queueMemberDrafts[queueId];
    if (!draft?.userId) {
      setErrorMessage("请填写成员用户 ID");
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
      setErrorMessage((error as Error).message || "添加成员失败");
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
      setErrorMessage((error as Error).message || "移除成员失败");
    }
  };

  const submitTemplates = async () => {
    setTemplateSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await supportApi.adminUpdateNotificationTemplates(templateConfig);
      setTemplateConfig(mergeTemplateConfig(response.templates));
    } catch (error) {
      setErrorMessage((error as Error).message || "保存通知模板失败");
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
            支持配置
          </h1>
          <p className="page-description">管理支持渠道与工单自动分派策略</p>
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
            刷新
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
                <h2 className="page-panel-title">支持渠道</h2>
                <p className="page-panel-description">配置对外支持入口与联系方式</p>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
                {channels.length} 个渠道
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LifeBuoy className="w-4 h-4 text-brand-500" />
                {editingChannelId ? "编辑渠道" : "新增渠道"}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Key (例如 email)"
                  value={channelForm.key}
                  onChange={(e) => setChannelForm((prev) => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="名称"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="联系方式"
                  value={channelForm.contact}
                  onChange={(e) => setChannelForm((prev) => ({ ...prev, contact: e.target.value }))}
                />
                <Input
                  placeholder="排序（数字）"
                  type="number"
                  value={channelForm.sortOrder}
                  onChange={(e) =>
                    setChannelForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">渠道首次响应 SLA（分钟）</label>
                <div className="grid sm:grid-cols-4 gap-3 mt-2">
                  <Input
                    type="number"
                    placeholder="紧急"
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
                    placeholder="高"
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
                    placeholder="中"
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
                    placeholder="低"
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
                  未填写将使用默认 SLA。
                </p>
              </div>
              <Input
                placeholder="描述（可选）"
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
                  启用渠道
                </div>
                <div className="flex items-center gap-2">
                  {editingChannelId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={resetChannelForm}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                    onClick={submitChannel}
                    disabled={channelSubmitting}
                  >
                    {channelSubmitting ? "保存中..." : "保存渠道"}
                  </Button>
                </div>
              </div>
            </div>

            {channels.length === 0 ? (
              <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                暂无渠道配置
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
                        <p className="text-xs text-foreground-muted mt-1">{channel.contact || "未填写联系方式"}</p>
                        {channel.sla_overrides && (
                          <p className="text-xs text-foreground-muted mt-1">
                            SLA 覆盖：{Object.keys(channel.sla_overrides).join(", ")}
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
                          编辑
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
                <h2 className="page-panel-title">自动分派规则</h2>
                <p className="page-panel-description">按优先级/渠道自动分派处理团队</p>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
                {rules.length} 条规则
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                {editingRuleId ? "编辑规则" : "新增规则"}
              </div>
              <Input
                placeholder="规则名称"
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
                  placeholder="关键词（可选）"
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
                    <option value="">选择团队</option>
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
                    <option value="">选择队列</option>
                    {queues.map((queue) => (
                      <option key={queue.id} value={queue.id}>
                        {queue.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="用户 ID"
                    value={ruleForm.assigneeValue}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, assigneeValue: e.target.value }))}
                  />
                )}
                <Input
                  placeholder="排序"
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
                  启用规则
                </div>
                <div className="flex items-center gap-2">
                  {editingRuleId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={resetRuleForm}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                    onClick={submitRule}
                    disabled={ruleSubmitting}
                  >
                    {ruleSubmitting ? "保存中..." : "保存规则"}
                  </Button>
                </div>
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                暂无分派规则
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
                            {rule.assignee_type || "team"} · {rule.assignee_value || "未设置"}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">
                          {rule.priority || "不限"} / {rule.category || "不限"} / {rule.channel || "不限"} / {rule.keyword || "无关键词"}
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
                          编辑
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-foreground-muted flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      排序：{rule.sort_order || 0}
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
                <h2 className="page-panel-title">支持团队</h2>
                <p className="page-panel-description">配置团队与成员映射</p>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
                {teams.length} 个团队
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-brand-500" />
                {editingTeamId ? "编辑团队" : "新增团队"}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="团队名称"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="描述（可选）"
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
                  启用团队
                </div>
                <div className="flex items-center gap-2">
                  {editingTeamId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={resetTeamForm}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                    onClick={submitTeam}
                    disabled={teamSubmitting}
                  >
                    {teamSubmitting ? "保存中..." : "保存团队"}
                  </Button>
                </div>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                暂无团队
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
                            编辑
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="成员用户 ID"
                          value={draft.userId}
                          onChange={(e) =>
                            setTeamMemberDrafts((prev) => ({
                              ...prev,
                              [team.id]: { ...draft, userId: e.target.value },
                            }))
                          }
                        />
                        <Input
                          placeholder="角色（可选）"
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
                            placeholder="排序"
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
                            添加
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
                <h2 className="page-panel-title">支持队列</h2>
                <p className="page-panel-description">将工单分派到队列成员</p>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
                {queues.length} 个队列
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Inbox className="w-4 h-4 text-brand-500" />
                {editingQueueId ? "编辑队列" : "新增队列"}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="队列名称"
                  value={queueForm.name}
                  onChange={(e) => setQueueForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="描述（可选）"
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
                  启用队列
                </div>
                <div className="flex items-center gap-2">
                  {editingQueueId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={resetQueueForm}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                    onClick={submitQueue}
                    disabled={queueSubmitting}
                  >
                    {queueSubmitting ? "保存中..." : "保存队列"}
                  </Button>
                </div>
              </div>
            </div>

            {queues.length === 0 ? (
              <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                暂无队列
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
                            编辑
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="成员用户 ID"
                          value={draft.userId}
                          onChange={(e) =>
                            setQueueMemberDrafts((prev) => ({
                              ...prev,
                              [queue.id]: { ...draft, userId: e.target.value },
                            }))
                          }
                        />
                        <Input
                          placeholder="排序"
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
                          添加
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
            <h2 className="page-panel-title">通知模板</h2>
          </div>
          <p className="page-panel-description">配置工单通知标题与内容模板</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-2">
              <div className="text-xs font-medium text-foreground">默认发送策略</div>
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
                当未指定渠道或语言时使用默认配置。
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-2">
              <div className="text-xs font-medium text-foreground">编辑模板范围</div>
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
                仅更新当前渠道与语言下的模板内容。
              </p>
            </div>
          </div>
          <div className="text-xs text-foreground-muted">
            可用变量：{"{{reference}}"}, {"{{subject}}"}, {"{{status}}"}, {"{{note}}"}, {"{{comment}}"}, {"{{assignee}}"}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {(
              [
                { key: "ticket_created", label: "工单创建" },
                { key: "status_updated", label: "状态更新" },
                { key: "comment_added", label: "评论新增" },
              ] as const
            ).map((item) => (
              <div key={item.key} className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <Input
                  placeholder="标题模板"
                  value={activeTemplates[item.key].title}
                  onChange={(e) => updateTemplateField(item.key, "title", e.target.value)}
                />
                <textarea
                  rows={4}
                  placeholder="内容模板"
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
              {templateSubmitting ? "保存中..." : "保存模板"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
