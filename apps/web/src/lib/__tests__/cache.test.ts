/**
 * Cache Module Test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CACHE_TIMES, queryKeys, localCache, dedupeRequest } from '../cache'

describe('CACHE_TIMES', () => {
  it('Should define correct cache times', () => {
    expect(CACHE_TIMES.INSTANT).toBe(0)
    expect(CACHE_TIMES.SHORT).toBe(60 * 1000)
    expect(CACHE_TIMES.MEDIUM).toBe(5 * 60 * 1000)
    expect(CACHE_TIMES.LONG).toBe(30 * 60 * 1000)
    expect(CACHE_TIMES.PERSISTENT).toBe(60 * 60 * 1000)
    expect(CACHE_TIMES.FOREVER).toBe(Infinity)
  })
})

describe('queryKeys', () => {
  describe('user', () => {
    it('Should generate correct user-related keys', () => {
      expect(queryKeys.user.all).toEqual(['user'])
      expect(queryKeys.user.profile()).toEqual(['user', 'profile'])
      expect(queryKeys.user.settings()).toEqual(['user', 'settings'])
    })
  })

  describe('workflows', () => {
    it('Should generate correct workflow-related keys', () => {
      expect(queryKeys.workflows.all).toEqual(['workflows'])
      expect(queryKeys.workflows.lists()).toEqual(['workflows', 'list'])
      expect(queryKeys.workflows.list({ status: 'active' })).toEqual([
        'workflows',
        'list',
        { status: 'active' },
      ])
      expect(queryKeys.workflows.detail('wf-123')).toEqual(['workflows', 'detail', 'wf-123'])
      expect(queryKeys.workflows.executions('wf-123')).toEqual([
        'workflows',
        'executions',
        'wf-123',
      ])
    })
  })

  describe('apiKeys', () => {
    it('Should generate correct API key-related keys', () => {
      expect(queryKeys.apiKeys.all).toEqual(['apiKeys'])
      expect(queryKeys.apiKeys.list()).toEqual(['apiKeys', 'list'])
      expect(queryKeys.apiKeys.providers()).toEqual(['apiKeys', 'providers'])
    })
  })

  describe('executions', () => {
    it('Should generate correct execution-related keys', () => {
      expect(queryKeys.executions.all).toEqual(['executions'])
      expect(queryKeys.executions.detail('exec-123')).toEqual(['executions', 'detail', 'exec-123'])
      expect(queryKeys.executions.logs('exec-123')).toEqual(['executions', 'logs', 'exec-123'])
    })
  })

  describe('store', () => {
    it('Should generate correct store-related keys', () => {
      expect(queryKeys.store.all).toEqual(['store'])
      expect(queryKeys.store.agents({ category: 'ai' })).toEqual([
        'store',
        'agents',
        { category: 'ai' },
      ])
      expect(queryKeys.store.agent('agent-123')).toEqual(['store', 'agent', 'agent-123'])
      expect(queryKeys.store.categories()).toEqual(['store', 'categories'])
    })
  })
})

describe('localCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('Should correctly set and get cache', () => {
    const data = { name: 'test' }
    localCache.set('test-key', data)

    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('Should correctly delete cache', () => {
    localCache.remove('test-key')
    expect(localStorage.removeItem).toHaveBeenCalledWith('agentflow_cache_test-key')
  })
})

describe('dedupeRequest', () => {
  it('Should ignore duplicate concurrent requests', async () => {
    const mockFn = vi.fn().mockResolvedValue('result')

    // Same concurrent requests
    const promise1 = dedupeRequest('key', mockFn)
    const promise2 = dedupeRequest('key', mockFn)

    const [result1, result2] = await Promise.all([promise1, promise2])

    // Function should be called only once
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(result1).toBe('result')
    expect(result2).toBe('result')
  })

  it('Different keys should execute separately', async () => {
    const mockFn = vi.fn().mockResolvedValue('result')

    await Promise.all([dedupeRequest('key1', mockFn), dedupeRequest('key2', mockFn)])

    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('After request completion should allow new request', async () => {
    const mockFn = vi.fn().mockResolvedValue('result')

    await dedupeRequest('key', mockFn)
    await dedupeRequest('key', mockFn)

    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
