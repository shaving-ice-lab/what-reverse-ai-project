import { redirect } from 'next/navigation'

/**
 * Legacy workspaces list page — redirects to /dashboard/workspace.
 * Workspace switching is now handled via the topnav dropdown.
 */
export default function WorkspacesPage() {
  redirect('/dashboard/workspace')
}
