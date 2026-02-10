export const workspaceFixture = {
  id: 'ws_123',
  owner_user_id: 'user_1',
  name: 'Test Workspace',
  slug: 'demo',
  icon: '🏢',
  status: 'active',
  plan: 'free',
  region: 'ap-east-1',
  settings_json: {},
  // App andField
  description: '',
  app_status: 'draft',
  current_version_id: null,
  pricing_type: 'free',
  price: null,
  published_at: null,
  access_mode: 'private',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-02T10:00:00Z',
} as const

export const workspaceAltFixture = {
  ...workspaceFixture,
  id: 'ws_456',
  name: 'Analytics Workspace',
  slug: 'analytics',
  plan: 'pro',
} as const

export const workspaceListFixture = [workspaceFixture, workspaceAltFixture] as const
