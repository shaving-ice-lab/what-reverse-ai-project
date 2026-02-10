import { test, expect, type Page } from '@playwright/test'

const user = {
  id: 'user_1',
  email: 'test@example.com',
  username: 'tester',
  role: 'admin',
  emailVerified: true,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-02T10:00:00Z',
}

const workspace = {
  id: 'ws_123',
  owner_user_id: 'user_1',
  name: 'Test Workspace',
  slug: 'demo',
  icon: '🏢',
  status: 'active',
  plan: 'free',
  region: 'ap-east-1',
  app_status: 'draft',
  settings_json: {},
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-02T10:00:00Z',
}

const draftApp = {
  id: 'app_123',
  workspace_id: 'ws_123',
  owner_user_id: 'user_1',
  name: 'Daily Report Assistant',
  slug: 'daily-report',
  icon: '📄',
  description: 'Generate daily report',
  status: 'draft',
  current_version_id: 'ver_1',
  pricing_type: 'free',
  price: null,
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-02T10:00:00Z',
  published_at: null,
  deleted_at: null,
}

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 'OK', message: 'OK', data }),
})

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          tokens: {
            accessToken: 'test-token',
            refreshToken: 'test-refresh',
            expiresIn: 3600,
          },
        },
        version: 0,
      })
    )
  })
}

async function mockApiRoutes(page: Page, appStore: Array<typeof draftApp>) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (path === '/api/v1/users/me') {
      return route.fulfill(respondOk({ ...user }))
    }

    if (path === '/api/v1/workspaces') {
      return route.fulfill(
        respondOk({
          items: [workspace],
          total: 1,
          page: 1,
          page_size: 20,
        })
      )
    }

    if (path === `/api/v1/workspaces/${workspace.id}`) {
      return route.fulfill(respondOk(workspace))
    }

    if (path === '/api/v1/workspaces' && method === 'POST') {
      const payload = request.postData() ? JSON.parse(request.postData() as string) : {}
      const created = {
        ...draftApp,
        id: 'app_456',
        name: payload.name || draftApp.name,
        slug: payload.slug || draftApp.slug,
        description: payload.description || draftApp.description,
      }
      appStore.splice(0, appStore.length, created)
      return route.fulfill(respondOk(created))
    }

    if (path === `/api/v1/workspaces/${draftApp.id}` && method === 'GET') {
      return route.fulfill(respondOk(appStore[0] || draftApp))
    }

    if (path === '/api/v1/workspaces/app_456' && method === 'GET') {
      return route.fulfill(respondOk(appStore[0]))
    }

    if (path === `/api/v1/workspaces/${draftApp.id}/publish` && method === 'POST') {
      const updated = {
        ...(appStore[0] || draftApp),
        app_status: 'published',
        published_at: '2026-02-03T10:00:00Z',
      }
      appStore.splice(0, appStore.length, updated)
      return route.fulfill(respondOk(updated))
    }

    if (path.endsWith('/versions') && method === 'GET') {
      return route.fulfill(
        respondOk({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
        })
      )
    }

    if (path.endsWith('/access-policy') && method === 'GET') {
      return route.fulfill(respondOk({ access_mode: 'private' }))
    }

    return route.fulfill(respondOk({}))
  })
}

test('create app flow navigates to builder', async ({ page }) => {
  const appStore: (typeof draftApp)[] = []
  await seedAuth(page)
  await mockApiRoutes(page, appStore)

  await page.goto('/dashboard/apps')
  await page.getByRole('button', { name: 'Create App' }).click()
  await page.getByPlaceholder('e.g. Daily Assistant').fill('Daily Report Assistant')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page).toHaveURL(new RegExp(`/dashboard/app/app_456/builder`))
})

test('publish app flow updates status', async ({ page }) => {
  const appStore: (typeof draftApp)[] = [{ ...draftApp }]
  await seedAuth(page)
  await mockApiRoutes(page, appStore)

  await page.goto('/dashboard/apps')
  await page.getByRole('button', { name: 'Publish' }).click()

  await expect(page.getByText('Published')).toBeVisible()
})

test('public runtime access renders execute action', async ({ page }) => {
  await page.route('**/runtime/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path.endsWith('/schema')) {
      return route.fulfill(
        respondOk({
          workspace: { name: 'Demo Workspace', slug: 'demo' },
          app: { name: 'Daily Report Assistant', slug: 'daily-report' },
          schema: {
            ui_schema: {
              blocks: [
                {
                  id: 'prompt',
                  type: 'input',
                  label: 'Info',
                  input_key: 'prompt',
                  validation: { required: true },
                  props: { placeholder: 'Please enterneedrequest' },
                },
              ],
            },
          },
        })
      )
    }

    return route.fulfill(
      respondOk({
        workspace: { name: 'Demo Workspace', slug: 'demo' },
        app: { name: 'Daily Report Assistant', slug: 'daily-report' },
        access_policy: { access_mode: 'public_anonymous' },
        session_id: 'sess_1',
      })
    )
  })

  await page.goto('/runtime/demo/daily-report')
  await expect(page.getByRole('button', { name: 'immediatelyExecute' })).toBeVisible()
})
