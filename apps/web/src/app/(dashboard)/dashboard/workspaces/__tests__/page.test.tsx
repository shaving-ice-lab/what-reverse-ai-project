import { describe, it, expect, vi } from 'vitest'

const mockRedirect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

describe('WorkspacesPage', () => {
  it('redirects to /dashboard/workspace', async () => {
    const { default: WorkspacesPage } = await import('../page')
    WorkspacesPage()
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/workspace')
  })
})
