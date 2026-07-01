import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface RealtimeEvent<T> {
  topic: string;
  payload: T;
}

@Injectable()
export class RealtimeHubService {
  private readonly emitter = new EventEmitter();

  publish<T>(topic: string, payload: T): void {
    this.emitter.emit(topic, { topic, payload } satisfies RealtimeEvent<T>);
  }

  subscribe<T>(topic: string, listener: (event: RealtimeEvent<T>) => void): () => void {
    this.emitter.on(topic, listener);
    return () => this.emitter.off(topic, listener);
  }
}
