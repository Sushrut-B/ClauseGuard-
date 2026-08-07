import { EventEmitter } from 'events'

export interface DomainEvent<T = any> {
  eventId: string
  eventType: string
  timestamp: string
  producer: string
  payload: T
}

export class DomainEventBus {
  private emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(50)
  }

  public publish<T = any>(eventType: string, producer: string, payload: T): DomainEvent<T> {
    const event: DomainEvent<T> = {
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      producer,
      payload,
    }

    this.emitter.emit(eventType, event)
    return event
  }

  public subscribe<T = any>(eventType: string, handler: (event: DomainEvent<T>) => void | Promise<void>) {
    this.emitter.on(eventType, async (event: DomainEvent<T>) => {
      try {
        await handler(event)
      } catch (err: any) {
        console.error(`[EventBus Error] Failed handling event ${eventType}:`, err.message)
      }
    })
  }
}

export const eventBus = new DomainEventBus()
