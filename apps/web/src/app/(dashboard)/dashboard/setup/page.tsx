"use client";

/**
 * Initial Settings Page: Name Workspace + Create First App
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { appApi } from "@/lib/api/workspace";
import { PageContainer, PageHeader, SettingsSection, FormRow } from "@/components/dashboard/page-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_WORKSPACE_NAME = "Default Workspace";
const SETUP_STORAGE_KEY = "agentflow-setup-completed";
const WORKSPACE_STORAGE_KEY = "last_workspace_id";

const slugify = (value: string) =>
 value
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
 .replace(/^-+|-+$/g, "");

export default function DashboardSetupPage() {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [workspace, setWorkspace] = useState<Workspace | null>(null);
 const [appsCount, setAppsCount] = useState(0);

 const [workspaceName, setWorkspaceName] = useState("");
 const [workspaceSlug, setWorkspaceSlug] = useState("");
 const [appName, setAppName] = useState("");
 const [appSlug, setAppSlug] = useState("");
 const [appDescription, setAppDescription] = useState("");

 const [workspaceSlugTouched, setWorkspaceSlugTouched] = useState(false);
 const [appSlugTouched, setAppSlugTouched] = useState(false);
 const [appNameTouched, setAppNameTouched] = useState(false);

 const hasApps = appsCount > 0;
 const isDefaultWorkspace = workspace?.name?.trim() === DEFAULT_WORKSPACE_NAME;

 useEffect(() => {
 let mounted = true;
 const load = async () => {
 setIsLoading(true);
 setError(null);
 try {
 const workspaces = await workspaceApi.list();
 if (!mounted) return;
 const storedId =
 typeof window !== "undefined" ? localStorage.getItem(WORKSPACE_STORAGE_KEY) : null;
 const active =
 workspaces.find((ws) => ws.id === storedId) ?? workspaces[0] ?? null;
 setWorkspace(active);

 if (active) {
 setWorkspaceName(active.name || "");
 setWorkspaceSlug(active.slug || "");
 const apps = await appApi.list({
 workspace_id: active.id,
 page: 1,
 pageSize: 1,
 });
 if (!mounted) return;
 setAppsCount(apps.items?.length ?? 0);
 if (apps.items?.length === 0) {
        const suggestedAppName = `${active.name || "My"} App`;
 setAppName(suggestedAppName);
 setAppSlug(slugify(suggestedAppName));
 }
 }
 } catch (err) {
 console.error("Failed to load setup context:", err);
      if (mounted) setError("Failed to load initial info. Please try again later.");
 } finally {
 if (mounted) setIsLoading(false);
 }
 };

 load();
 return () => {
 mounted = false;
 };
 }, []);

 useEffect(() => {
 if (!workspaceName) return;
 if (!workspaceSlugTouched) {
 setWorkspaceSlug(slugify(workspaceName));
 }
 if (!appNameTouched && !hasApps) {
 const nextAppName = `${workspaceName} App`;
 setAppName(nextAppName);
 if (!appSlugTouched) {
 setAppSlug(slugify(nextAppName));
 }
 }
 }, [workspaceName, workspaceSlugTouched, appNameTouched, appSlugTouched, hasApps]);

 const canSubmit = useMemo(() => {
 if (!workspaceName.trim()) return false;
 if (!workspaceSlug.trim()) return false;
 if (!hasApps && !appName.trim()) return false;
 if (!hasApps && !appSlug.trim()) return false;
 return true;
 }, [workspaceName, workspaceSlug, appName, appSlug, hasApps]);

 const handleSubmit = async () => {
 if (!canSubmit) return;
 setError(null);
 setIsSubmitting(true);

 try {
 let targetWorkspace = workspace;
 const trimmedWorkspaceName = workspaceName.trim();
 const normalizedWorkspaceSlug = workspaceSlug.trim() || slugify(trimmedWorkspaceName);

 if (!targetWorkspace) {
 targetWorkspace = await workspaceApi.create({
 name: trimmedWorkspaceName,
 slug: normalizedWorkspaceSlug,
 });
 } else {
 const shouldUpdate =
 targetWorkspace.name !== trimmedWorkspaceName ||
 targetWorkspace.slug !== normalizedWorkspaceSlug;
 if (shouldUpdate) {
 targetWorkspace = await workspaceApi.update(targetWorkspace.id, {
 name: trimmedWorkspaceName,
 slug: normalizedWorkspaceSlug,
 });
 }
 }

 let createdAppId: string | null = null;
 if (!hasApps) {
 const trimmedAppName = appName.trim();
 const normalizedAppSlug = appSlug.trim() || slugify(trimmedAppName);
 const app = await appApi.create({
 workspace_id: targetWorkspace.id,
 name: trimmedAppName,
 slug: normalizedAppSlug,
 description: appDescription.trim() || undefined,
 });
 createdAppId = app.id;
 }

 if (typeof window !== "undefined") {
 localStorage.setItem(SETUP_STORAGE_KEY, "true");
 localStorage.setItem(WORKSPACE_STORAGE_KEY, targetWorkspace.id);
 }

 if (createdAppId) {
 router.replace(`/dashboard/app/${createdAppId}/builder`);
 } else {
 router.replace("/dashboard/apps");
 }
 } catch (err) {
 console.error("Failed to finish setup:", err);
      setError(err instanceof Error ? err.message: "Setup failed. Please try again later.");
 } finally {
 setIsSubmitting(false);
 }
 };

 if (isLoading) {
 return (
 <PageContainer>
 <div className="page-panel p-10 flex items-center justify-center">
 <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
 </div>
 </PageContainer>
 );
 }

 return (
 <PageContainer>
 <PageHeader
 eyebrow="Setup"
      title="Initialize Your Workspace"
      description="Set your workspace name and create your first app."
 icon={<Rocket className="w-4 h-4" />}
 badge={
 isDefaultWorkspace ? (
 <Badge variant="secondary" size="xs">
 Default Workspace
 </Badge>
 ) : null
 }
 />

 <div className="space-y-4">
 {error && (
 <div className="page-panel p-4 border border-destructive/40 bg-destructive-200/30 text-destructive text-sm">
 {error}
 </div>
 )}

 <SettingsSection
 title="Workspace Naming"
      description="Set your workspace name and URL identifier (slug)."
 footer={
 <div className="flex items-center gap-2">
 {isDefaultWorkspace && (
            <Badge variant="outline" size="xs">
              We suggest editing the default name
            </Badge>
 )}
 <Button
 onClick={handleSubmit}
 disabled={!canSubmit || isSubmitting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Saving...
 </>
 ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Setup
            </>
 )}
 </Button>
 </div>
 }
 >
 <div className="space-y-4">
 <FormRow label="Workspace Name" required>
 <Input
 value={workspaceName}
 onChange={(e) => {
 setWorkspaceName(e.target.value);
 }}
          placeholder="e.g. My Team"
 />
 </FormRow>
        <FormRow label="Workspace Slug" required description="Used for links and identifiers (auto-generated)">
 <Input
 value={workspaceSlug}
 onChange={(e) => {
 setWorkspaceSlugTouched(true);
 setWorkspaceSlug(e.target.value);
 }}
          placeholder="e.g. my-team"
 />
 </FormRow>
 </div>
 </SettingsSection>

      <SettingsSection
        title="Create Your First App"
        description={hasApps ? "We detected you already have an app. You can continue directly.": "Create an app to get started with your first project."}
 >
 <div className={cn("space-y-4", hasApps && "opacity-60")}>
 <FormRow label="App Name" required={!hasApps}>
 <Input
 value={appName}
 onChange={(e) => {
 setAppNameTouched(true);
 setAppName(e.target.value);
 if (!appSlugTouched) {
 setAppSlug(slugify(e.target.value));
 }
 }}
          placeholder="e.g. Support Automation"
 disabled={hasApps}
 />
 </FormRow>
        <FormRow label="App Slug" required={!hasApps} description="Used for links and identifiers (auto-generated)">
 <Input
 value={appSlug}
 onChange={(e) => {
 setAppSlugTouched(true);
 setAppSlug(e.target.value);
 }}
          placeholder="e.g. support-bot"
 disabled={hasApps}
 />
 </FormRow>
        <FormRow label="App Description" description="Optional. Describe your app's purpose.">
 <Input
 value={appDescription}
 onChange={(e) => setAppDescription(e.target.value)}
          placeholder="e.g. Auto-reply FAQ"
 disabled={hasApps}
 />
 </FormRow>
 </div>
 </SettingsSection>
 </div>
 </PageContainer>
 );
}

