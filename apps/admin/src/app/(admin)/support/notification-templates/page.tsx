"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Save, Settings2 } from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";
import { adminApi } from "@/lib/api/admin";
import {
  supportChannels as supportChannelsMock,
  supportNotificationTemplates as supportNotificationTemplatesMock,
} from "@/lib/mock-data";
import { isLocalModeEnabled } from "@/lib/env";
import { cn } from "@/lib/utils";
import type {
  SupportChannel,
  SupportNotificationTemplateConfig,
  SupportNotificationTemplates,
} from "@/types/admin";

const MOCK_TEMPLATES_CONFIG =
  supportNotificationTemplatesMock as unknown as SupportNotificationTemplateConfig;
const MOCK_DEFAULT_CHANNEL =
  Object.keys(MOCK_TEMPLATES_CONFIG.channels || {})[0] ||
  MOCK_TEMPLATES_CONFIG.default_channel ||
  "system";
const MOCK_DEFAULT_LOCALE =
  Object.keys(MOCK_TEMPLATES_CONFIG.channels?.[MOCK_DEFAULT_CHANNEL] || {})[0] ||
  MOCK_TEMPLATES_CONFIG.default_locale ||
  "zh-CN";

function deepClone<T>(value: T): T {
  if (typeof structuredClone !== "undefined") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureGroupTemplates(group?: Partial<SupportNotificationTemplates> | null): SupportNotificationTemplates {
  const empty = { title: "", content: "" };
  return {
    ticket_created: { ...empty, ...(group?.ticket_created || {}) },
    status_updated: { ...empty, ...(group?.status_updated || {}) },
    comment_added: { ...empty, ...(group?.comment_added || {}) },
  };
}

export default function SupportNotificationTemplatesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("support.manage");

  const [includeDisabledChannels, setIncludeDisabledChannels] = useState(false);

  const [localConfig, setLocalConfig] = useState<SupportNotificationTemplateConfig>(() =>
    deepClone(MOCK_TEMPLATES_CONFIG)
  );
  const [dirty, setDirty] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ["admin", "support", "notificationTemplates"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.notificationTemplates.get(),
  });

  const sourceConfig = localMode ? localConfig : templatesQuery.data?.templates;

  const [draft, setDraft] = useState<SupportNotificationTemplateConfig>(() =>
    deepClone(MOCK_TEMPLATES_CONFIG)
  );

  useEffect(() => {
    if (localMode) {
      if (!dirty) setDraft(deepClone(localConfig));
      return;
    }
    if (templatesQuery.data?.templates && !dirty) {
      setDraft(deepClone(templatesQuery.data.templates));
    }
  }, [dirty, localConfig, localMode, templatesQuery.data?.templates]);

  const channelLabels = useMemo(() => {
    const mocks = supportChannelsMock as unknown as SupportChannel[];
    const map = new Map<string, string>();
    mocks.forEach((c) => map.set(c.key, c.name));
    return map;
  }, []);

  const channelKeys = useMemo(() => {
    const keys = Object.keys(draft.channels || {});
    return keys.sort((a, b) => a.localeCompare(b));
  }, [draft.channels]);

  const [selectedChannel, setSelectedChannel] = useState<string>(MOCK_DEFAULT_CHANNEL);

  useEffect(() => {
    if (!channelKeys.includes(selectedChannel)) {
      setSelectedChannel(channelKeys[0] || "system");
    }
  }, [channelKeys, selectedChannel]);

  const localeKeys = useMemo(() => {
    const locales = draft.channels?.[selectedChannel] || {};
    return Object.keys(locales).sort((a, b) => a.localeCompare(b));
  }, [draft.channels, selectedChannel]);

  const [selectedLocale, setSelectedLocale] = useState<string>(MOCK_DEFAULT_LOCALE);

  useEffect(() => {
    if (!localeKeys.includes(selectedLocale)) {
      setSelectedLocale(localeKeys[0] || draft.default_locale || "zh-CN");
    }
  }, [draft.default_locale, localeKeys, selectedLocale]);

  const currentTemplates = useMemo(() => {
    const group = draft.channels?.[selectedChannel]?.[selectedLocale];
    return ensureGroupTemplates(group);
  }, [draft.channels, selectedChannel, selectedLocale]);

  const setTemplateField = (
    key: keyof SupportNotificationTemplates,
    field: "title" | "content",
    value: string
  ) => {
    setDirty(true);
    setDraft((prev) => {
      const next = deepClone(prev);
      if (!next.channels) next.channels = {};
      if (!next.channels[selectedChannel]) next.channels[selectedChannel] = {};
      const group = ensureGroupTemplates(next.channels[selectedChannel][selectedLocale]);
      group[key][field] = value;
      next.channels[selectedChannel][selectedLocale] = group;
      return next;
    });
  };

  const setConfigField = (field: "default_channel" | "default_locale", value: string) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateMutation = useMutation({
    mutationFn: (config: SupportNotificationTemplateConfig) =>
      adminApi.support.notificationTemplates.update(config),
    onSuccess: async (data) => {
      toast.success("已保存通知模板");
      setDirty(false);
      setDraft(deepClone(data.templates));
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "notificationTemplates"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "保存失败"),
  });

  const save = async () => {
    if (!dirty) {
      toast.message("没有需要保存的变更");
      return;
    }

    if (localMode) {
      setLocalConfig(deepClone(draft));
      setDirty(false);
      toast.success("已保存通知模板（本地模式）");
      return;
    }

    if (!canManage) {
      toast.error("无权限执行该操作");
      return;
    }

    await updateMutation.mutateAsync(draft);
  };

  const reset = () => {
    if (localMode) {
      setDraft(deepClone(localConfig));
      setDirty(false);
      toast.message("已重置（本地模式）");
      return;
    }
    const serverConfig = templatesQuery.data?.templates;
    if (serverConfig) {
      setDraft(deepClone(serverConfig));
      setDirty(false);
      toast.message("已重置为服务器配置");
    } else {
      toast.error("暂无可重置的服务器配置");
    }
  };

  const isBusy = updateMutation.isPending;
  const channelLabel = channelLabels.get(selectedChannel) || selectedChannel;

  return (
    <PageContainer>
      <PageHeader
        title="通知模板"
        description="配置工单通知的标题与内容（多渠道/多语言）。"
        icon={<Bell className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => templatesQuery.refetch()} disabled={localMode}>
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={reset} disabled={isBusy}>
              重置
            </Button>
            <Button size="sm" onClick={() => void save()} loading={isBusy} loadingText="保存中...">
              <Save className="w-4 h-4" />
              保存
            </Button>
          </div>
        }
      />

      <SettingsSection title="当前配置" description="变更会在工单创建/状态更新/评论时触发通知渲染。">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="outline" size="sm">
            {dirty ? "已修改（未保存）" : "已同步"}
          </Badge>
          {localMode ? (
            <Badge variant="secondary" size="sm">
              Local mode
            </Badge>
          ) : null}
          {!localMode && templatesQuery.error ? (
            <Badge variant="error" size="sm">
              加载失败
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormRow
            label="默认 Channel"
            description="当工单渠道未命中配置时，会使用默认渠道。"
          >
            <Input
              value={draft.default_channel || ""}
              onChange={(e) => setConfigField("default_channel", e.target.value)}
              placeholder="system"
            />
          </FormRow>
          <FormRow label="默认 Locale" description="当 locale 缺失时使用的默认语言。">
            <Input
              value={draft.default_locale || ""}
              onChange={(e) => setConfigField("default_locale", e.target.value)}
              placeholder="zh-CN"
            />
          </FormRow>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-foreground-muted">Channel</span>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {channelKeys.map((key) => (
                  <option key={key} value={key}>
                    {channelLabels.get(key) ? `${channelLabels.get(key)} (${key})` : key}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-foreground-muted">Locale</span>
              <select
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value)}
                className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {localeKeys.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-foreground-muted">包含停用渠道</span>
              <Switch
                checked={includeDisabledChannels}
                onCheckedChange={setIncludeDisabledChannels}
              />
            </div>
          </div>

          <div className="mt-3 text-[11px] text-foreground-muted">
            当前：<span className="text-foreground-light">{channelLabel}</span> ·{" "}
            <span className="font-mono text-foreground-light">{selectedLocale}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <SettingsSection
              title="ticket_created"
              description="工单创建通知（常用变量：{{ticket.reference}}/{{ticket.subject}}）。"
            >
              <div className="space-y-3">
                <FormRow label="标题">
                  <Input
                    value={currentTemplates.ticket_created.title}
                    onChange={(e) => setTemplateField("ticket_created", "title", e.target.value)}
                    placeholder="收到新工单 {{ticket.reference}}"
                  />
                </FormRow>
                <FormRow label="内容">
                  <textarea
                    value={currentTemplates.ticket_created.content}
                    onChange={(e) => setTemplateField("ticket_created", "content", e.target.value)}
                    rows={5}
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "font-mono text-[11px] text-foreground-light",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                    spellCheck={false}
                  />
                </FormRow>
              </div>
            </SettingsSection>

            <SettingsSection
              title="status_updated"
              description="状态变更通知（常用变量：{{ticket.status}}/{{ticket.note}}）。"
            >
              <div className="space-y-3">
                <FormRow label="标题">
                  <Input
                    value={currentTemplates.status_updated.title}
                    onChange={(e) => setTemplateField("status_updated", "title", e.target.value)}
                    placeholder="工单状态更新：{{ticket.reference}}"
                  />
                </FormRow>
                <FormRow label="内容">
                  <textarea
                    value={currentTemplates.status_updated.content}
                    onChange={(e) => setTemplateField("status_updated", "content", e.target.value)}
                    rows={5}
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "font-mono text-[11px] text-foreground-light",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                    spellCheck={false}
                  />
                </FormRow>
              </div>
            </SettingsSection>

            <SettingsSection
              title="comment_added"
              description="评论新增通知（常用变量：{{comment.author}}/{{comment.body}}）。"
            >
              <div className="space-y-3">
                <FormRow label="标题">
                  <Input
                    value={currentTemplates.comment_added.title}
                    onChange={(e) => setTemplateField("comment_added", "title", e.target.value)}
                    placeholder="工单新回复：{{ticket.reference}}"
                  />
                </FormRow>
                <FormRow label="内容">
                  <textarea
                    value={currentTemplates.comment_added.content}
                    onChange={(e) => setTemplateField("comment_added", "content", e.target.value)}
                    rows={5}
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "font-mono text-[11px] text-foreground-light",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                    spellCheck={false}
                  />
                </FormRow>
              </div>
            </SettingsSection>
          </div>
        </div>

        {!includeDisabledChannels ? null : (
          <div className="mt-4 text-[11px] text-foreground-muted">
            提示：当前页面的 Channel 下拉来自模板配置本身（不是 channels 列表）。如需管理渠道，请前往“支持渠道”页。
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="高级（JSON）"
        description="可直接编辑整份配置（用于批量调整或新增语言）。"
      >
        <div className="mb-3 text-[11px] text-foreground-muted">
          变量采用 <span className="font-mono">{"{{token}}"}</span> 格式，渲染由后端模板服务完成。
        </div>
        <FormRow label="配置 JSON">
          <textarea
            value={JSON.stringify(draft, null, 2)}
            onChange={(e) => {
              const raw = e.target.value;
              try {
                const parsed = JSON.parse(raw) as SupportNotificationTemplateConfig;
                setDraft(parsed);
                setDirty(true);
              } catch {
                // 允许暂时无效的 JSON 输入：不更新 draft
              }
            }}
            rows={18}
            className={cn(
              "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
              "font-mono text-[11px] text-foreground-light",
              "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            )}
            spellCheck={false}
          />
        </FormRow>
        <div className="mt-3 flex items-center justify-between text-[11px] text-foreground-muted">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span>
              建议先在结构化编辑区调整，再使用 JSON 做批量操作。
            </span>
          </div>
          <div>
            {sourceConfig ? (
              <span className="font-mono">channels:{Object.keys(sourceConfig.channels || {}).length}</span>
            ) : (
              <span>未加载</span>
            )}
          </div>
        </div>
      </SettingsSection>
    </PageContainer>
  );
}

