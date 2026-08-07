export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetTimeoutMs?: number
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private failureThreshold: number
  private resetTimeoutMs: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeoutMs = options.resetTimeoutMs || 30000
  }

  public getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN
      }
    }
    return this.state
  }

  public async execute<T>(fn: () => Promise<T>, fallbackFn?: () => T | Promise<T>): Promise<T> {
    const currentState = this.getState()

    if (currentState === CircuitState.OPEN) {
      if (fallbackFn) {
        return fallbackFn()
      }
      throw new Error('Circuit Breaker is OPEN: Upstream service unavailable')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      if (fallbackFn) {
        return fallbackFn()
      }
      throw err
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = CircuitState.CLOSED
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }
}

export const geminiCircuitBreaker = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30000 })
