import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 'OK', message: 'OK', data }),
})

test('public runtime page passes basic a11y checks', async ({ page }) => {
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

  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()

  const seriousOrCritical = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact || '')
  )

  expect(seriousOrCritical).toEqual([])
})
