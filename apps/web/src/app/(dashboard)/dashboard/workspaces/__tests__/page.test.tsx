import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { workspaceListFixture } from '@/test/fixtures/workspace'
import WorkspacesPage from '../page'

const { mockList } = vi.hoisted(() => ({
  mockList: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user_1',
      email: 'test@example.com',
      username: 'tester',
      role: 'admin',
      emailVerified: true,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-02T10:00:00Z',
    },
  }),
}))

vi.mock('@/lib/api/workspace', () => ({
  workspaceApi: {
    list: mockList,
    create: vi.fn(),
  },
}))

describe('WorkspacesPage', () => {
  beforeEach(() => {
    mockList.mockResolvedValue(workspaceListFixture)
  })

  it('renders workspace list and filters by search', async () => {
    render(<WorkspacesPage />)

    // etcpendingWorkspaceDataLoadDone（NameAppearatSidebarand/ormainContent）
    const testWsElements = await screen.findAllByText('Test Workspace')
    expect(testWsElements.length).toBeGreaterThan(0)

    // mainContent，workspace NameRenderat <h3> Tags
    const testWsCards = testWsElements.filter((el) => el.tagName === 'H3')
    expect(testWsCards.length).toBeGreaterThan(0)

    // "Create Workspace" button
    const createButtons = screen.getAllByRole('button', { name: 'Create Workspace' })
    expect(createButtons.length).toBeGreaterThan(0)

    // InputSearch "analytics" (Match slug: "analytics" 's "AnalyticsWorkspace")
    const searchInput = screen.getByPlaceholderText('Search workspaces')
    fireEvent.change(searchInput, { target: { value: 'analytics' } })

    // After search, main content should not display "Test Workspace" card (<h3>)
    // Note：Sidebar recentWorkspaces notSearchFilterImpact
    await waitFor(() => {
      const allTestWs = screen.queryAllByText('Test Workspace')
      const cardH3 = allTestWs.find((el) => el.tagName === 'H3')
      expect(cardH3).toBeUndefined()
    })

    // "AnalyticsWorkspace" can
    expect(screen.getAllByText('Analytics Workspace').length).toBeGreaterThan(0)
  })
})
