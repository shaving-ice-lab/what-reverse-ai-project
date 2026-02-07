"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatDate } from "@/lib/utils";

// Mock data
interface Template {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  parameters: Record<string, unknown>;
  is_default: boolean;
  usage_count: number;
  created_at: string;
}

const mockTemplates: Template[] = [
  {
    id: "tpl-1",
    name: "General Assistant",
    description: "A general-purpose conversation template suitable for most scenarios",
    system_prompt: "You are a helpful AI assistant, answering user questions in a friendly and professional manner.",
    model: "gpt-4",
    parameters: { temperature: 0.7, max_tokens: 2048 },
    is_default: true,
    usage_count: 15420,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl-2",
    name: "Code Assistant",
    description: "A template focused on coding and technical questions",
    system_prompt: "You are a professional programming assistant, skilled at writing clear and efficient code.",
    model: "gpt-4",
    parameters: { temperature: 0.3, max_tokens: 4096 },
    is_default: false,
    usage_count: 8320,
    created_at: "2026-01-05T00:00:00Z",
  },
  {
    id: "tpl-3",
    name: "Writing Assistant",
    description: "Helps users with creative writing and content creation",
    system_prompt: "You are a creative writing assistant, helping users compose various types of text content.",
    model: "gpt-4-turbo",
    parameters: { temperature: 0.9, max_tokens: 4096 },
    is_default: false,
    usage_count: 5210,
    created_at: "2026-01-10T00:00:00Z",
  },
];

const MODEL_OPTIONS = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"];

export default function ConversationTemplatesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  const [formModel, setFormModel] = useState("gpt-4");
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formMaxTokens, setFormMaxTokens] = useState(2048);

  const [localTemplates, setLocalTemplates] = useState(mockTemplates);

  const templatesQuery = useQuery({
    queryKey: ["admin", "conversations", "templates", search],
    enabled: !localMode,
    queryFn: () => adminApi.conversations.getTemplates({ search: search || undefined }),
  });

  const filteredTemplates = localMode
    ? localTemplates.filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      )
    : templatesQuery.data?.items || [];

  const openCreateDialog = () => {
    setSelectedTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormSystemPrompt("");
    setFormModel("gpt-4");
    setFormTemperature(0.7);
    setFormMaxTokens(2048);
    setEditOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormSystemPrompt(template.system_prompt);
    setFormModel(template.model);
    setFormTemperature((template.parameters as { temperature?: number })?.temperature || 0.7);
    setFormMaxTokens((template.parameters as { max_tokens?: number })?.max_tokens || 2048);
    setEditOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: formName,
        description: formDescription,
        system_prompt: formSystemPrompt,
        model: formModel,
        parameters: { temperature: formTemperature, max_tokens: formMaxTokens },
      };

      if (localMode) {
        if (selectedTemplate) {
          setLocalTemplates((prev) =>
            prev.map((t) => (t.id === selectedTemplate.id ? { ...t, ...input } : t))
          );
        } else {
          const newTemplate = {
            id: `tpl-${Date.now()}`,
            ...input,
            is_default: false,
            usage_count: 0,
            created_at: new Date().toISOString(),
          };
          setLocalTemplates((prev) => [...prev, newTemplate]);
        }
        return { template: { id: selectedTemplate?.id || "new", name: formName } };
      }

      if (selectedTemplate) {
        return adminApi.conversations.updateTemplate(selectedTemplate.id, input);
      }
      return adminApi.conversations.createTemplate(input);
    },
    onSuccess: () => {
      toast.success(selectedTemplate ? "Template updated" : "Template created");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "templates"] });
    },
    onError: () => toast.error("Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (localMode) {
        setLocalTemplates((prev) => prev.filter((t) => t.id !== templateId));
        return { success: true };
      }
      return adminApi.conversations.deleteTemplate(templateId);
    },
    onSuccess: () => {
      toast.success("Template deleted");
      setDeleteOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "templates"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (localMode) {
        setLocalTemplates((prev) =>
          prev.map((t) => ({ ...t, is_default: t.id === templateId }))
        );
        return { success: true };
      }
      return adminApi.conversations.setDefaultTemplate(templateId);
    },
    onSuccess: () => {
      toast.success("Default template set");
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "templates"] });
    },
    onError: () => toast.error("Setting failed"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Conversation Template Management"
        description="Manage preset templates and prompt configurations for the conversation system."
        icon={<FileText className="w-4 h-4" />}
        backHref="/conversations"
        backLabel="Back to Conversations"
        actions={
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Template
          </Button>
        }
      />

      <SettingsSection
        title="Template List"
        description="Configured conversation templates."
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search template name or description"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            {filteredTemplates.length} templates
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Parameters</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  No templates
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                          {template.name}
                          {template.is_default && (
                            <Badge variant="success" size="sm">
                              <Star className="w-3 h-3 mr-0.5" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-foreground-muted mt-0.5">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {template.model}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    temp: {(template.parameters as { temperature?: number })?.temperature || 0.7}
                    <br />
                    max: {(template.parameters as { max_tokens?: number })?.max_tokens || 2048}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {template.usage_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatDate(template.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!template.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(template.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteOpen(template.id)}
                        disabled={template.is_default}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileText className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>{selectedTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>
              Configure template basic info and model parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Template Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Model</label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                >
                  {MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Description</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of template purpose"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">System Prompt</label>
              <textarea
                value={formSystemPrompt}
                onChange={(e) => setFormSystemPrompt(e.target.value)}
                rows={4}
                    placeholder="Enter system prompt..."
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Temperature</label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={formTemperature}
                  onChange={(e) => setFormTemperature(parseFloat(e.target.value) || 0.7)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Max Tokens</label>
                <Input
                  type="number"
                  min={256}
                  max={32000}
                  value={formMaxTokens}
                  onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 2048)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteOpen)}
        onOpenChange={(open) => !open && setDeleteOpen(null)}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Confirm Delete"
        onConfirm={() => deleteOpen && deleteMutation.mutate(deleteOpen)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
}
