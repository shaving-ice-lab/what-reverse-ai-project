/**
 * Concurrency Safety Utilities
 *
 * Resolve frontend state and concurrency issues
 */

// ===== Mutex =====
export class Mutex {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      next?.()
    } else {
      this.locked = false
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

// ===== Read-Write Mutex =====
export class RWMutex {
  private readers = 0
  private writer = false
  private readQueue: Array<() => void> = []
  private writeQueue: Array<() => void> = []

  async acquireRead(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.writer && this.writeQueue.length === 0) {
        this.readers++
        resolve()
      } else {
        this.readQueue.push(resolve)
      }
    })
  }

  releaseRead(): void {
    this.readers--
    if (this.readers === 0 && this.writeQueue.length > 0) {
      this.writer = true
      const next = this.writeQueue.shift()
      next?.()
    }
  }

  async acquireWrite(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.writer && this.readers === 0) {
        this.writer = true
        resolve()
      } else {
        this.writeQueue.push(resolve)
      }
    })
  }

  releaseWrite(): void {
    this.writer = false
    // Prioritize processing pending read requests
    while (this.readQueue.length > 0 && this.writeQueue.length === 0) {
      this.readers++
      const next = this.readQueue.shift()
      next?.()
    }
    // If there are no read requests, process write requests
    if (this.readers === 0 && this.writeQueue.length > 0) {
      this.writer = true
      const next = this.writeQueue.shift()
      next?.()
    }
  }

  async withReadLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireRead()
    try {
      return await fn()
    } finally {
      this.releaseRead()
    }
  }

  async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireWrite()
    try {
      return await fn()
    } finally {
      this.releaseWrite()
    }
  }
}

// ===== Debounced Request =====
interface DebouncedRequest<T> {
  promise: Promise<T>
  cancel: () => void
}

export function createDebouncedRequest<T>(
  fn: () => Promise<T>,
  delay: number
): DebouncedRequest<T> {
  let timeoutId: NodeJS.Timeout | null = null
  let cancelled = false

  const promise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(async () => {
      if (cancelled) {
        reject(new Error('Request cancelled'))
        return
      }
      try {
        const result = await fn()
        if (!cancelled) {
          resolve(result)
        }
      } catch (error) {
        if (!cancelled) {
          reject(error)
        }
      }
    }, delay)
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
  }
}

// ===== Request Serializer =====
export class RequestSerializer {
  private pendingRequests = new Map<string, Promise<unknown>>()
  private mutex = new Mutex()

  async execute<T>(key: string, request: () => Promise<T>): Promise<T> {
    return this.mutex.withLock(async () => {
      // Check if there's an identical request currently in progress
      const pending = this.pendingRequests.get(key)
      if (pending) {
        return pending as Promise<T>
      }

      // Create new request
      const promise = request().finally(() => {
        this.pendingRequests.delete(key)
      })

      this.pendingRequests.set(key, promise)
      return promise
    })
  }

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  cancelAll(): void {
    this.pendingRequests.clear()
  }
}

// ===== Versioned State =====
export class VersionedState<T> {
  private value: T
  private version = 0

  constructor(initialValue: T) {
    this.value = initialValue
  }

  get(): { value: T; version: number } {
    return { value: this.value, version: this.version }
  }

  set(newValue: T, expectedVersion?: number): boolean {
    if (expectedVersion !== undefined && expectedVersion !== this.version) {
      return false // Version mismatch, update failed
    }
    this.value = newValue
    this.version++
    return true
  }

  compareAndSet(expectedVersion: number, newValue: T): boolean {
    if (this.version !== expectedVersion) {
      return false
    }
    this.value = newValue
    this.version++
    return true
  }

  getVersion(): number {
    return this.version
  }
}

// ===== Atomic Counter =====
export class AtomicCounter {
  private value: number

  constructor(initialValue = 0) {
    this.value = initialValue
  }

  get(): number {
    return this.value
  }

  increment(): number {
    return ++this.value
  }

  decrement(): number {
    return --this.value
  }

  add(delta: number): number {
    this.value += delta
    return this.value
  }

  compareAndSet(expected: number, newValue: number): boolean {
    if (this.value === expected) {
      this.value = newValue
      return true
    }
    return false
  }

  reset(): void {
    this.value = 0
  }
}

// ===== Cancellation Token =====
export class CancellationToken {
  private cancelled = false
  private callbacks: Array<() => void> = []

  isCancelled(): boolean {
    return this.cancelled
  }

  cancel(): void {
    if (this.cancelled) return
    this.cancelled = true
    this.callbacks.forEach((cb) => cb())
    this.callbacks = []
  }

  onCancel(callback: () => void): () => void {
    if (this.cancelled) {
      callback()
      return () => {}
    }
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index !== -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error('Operation cancelled')
    }
  }
}

// ===== Cancellable Promise =====
export function cancellablePromise<T>(promise: Promise<T>, token: CancellationToken): Promise<T> {
  return new Promise((resolve, reject) => {
    const unsubscribe = token.onCancel(() => {
      reject(new Error('Operation cancelled'))
    })

    promise
      .then((value) => {
        unsubscribe()
        if (!token.isCancelled()) {
          resolve(value)
        }
      })
      .catch((error) => {
        unsubscribe()
        if (!token.isCancelled()) {
          reject(error)
        }
      })
  })
}

// ===== Batch Processor =====
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (r: R) => void; reject: (e: Error) => void }> = []
  private timer: NodeJS.Timeout | null = null
  private readonly batchSize: number
  private readonly delay: number
  private readonly processor: (items: T[]) => Promise<R[]>

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; delay?: number } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 10
    this.delay = options.delay || 50
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject })

      if (this.queue.length >= this.batchSize) {
        this.flush()
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay)
      }
    })
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.batchSize)
    const items = batch.map((b) => b.item)

    try {
      const results = await this.processor(items)
      batch.forEach((b, i) => b.resolve(results[i]))
    } catch (error) {
      batch.forEach((b) => b.reject(error as Error))
    }
  }
}

// ===== Semaphore =====
export class Semaphore {
  private permits: number
  private queue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      next?.()
    } else {
      this.permits++
    }
  }

  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }

  availablePermits(): number {
    return this.permits
  }
}
