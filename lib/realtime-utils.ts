// Real-time connection utilities for better reliability
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  heartbeatInterval?: number;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

export class RealtimeConnectionManager {
  private retryCount = 0;
  private maxRetries: number;
  private retryDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimer?: NodeJS.Timeout;
  private onConnectionLost?: () => void;
  private onConnectionRestored?: () => void;

  constructor(options: RealtimeConnectionOptions = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 2000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.onConnectionLost = options.onConnectionLost;
    this.onConnectionRestored = options.onConnectionRestored;
  }

  handleSubscriptionStatus(
    status: string, 
    channel: RealtimeChannel | null,
    reconnectFn: () => RealtimeChannel | null
  ): void {
    console.log(`📡 Real-time status: ${status} (retry ${this.retryCount}/${this.maxRetries})`);

    switch (status) {
      case 'SUBSCRIBED':
        console.log('✅ Real-time connection established');
        this.retryCount = 0; // Reset retry count on successful connection
        this.startHeartbeat();
        this.onConnectionRestored?.();
        break;

      case 'CHANNEL_ERROR':
      case 'CLOSED':
      case 'TIMED_OUT':
        console.log(`❌ Real-time connection ${status.toLowerCase()}`);
        this.stopHeartbeat();
        this.onConnectionLost?.();
        
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
          console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${this.retryCount})`);
          
          setTimeout(() => {
            try {
              reconnectFn();
            } catch (error) {
              console.error('❌ Reconnection attempt failed:', error);
            }
          }, delay);
        } else {
          console.log('❌ Max retry attempts reached, giving up on real-time connection');
        }
        break;

      case 'CONNECTING':
        console.log('🔄 Connecting to real-time...');
        break;

      default:
        console.log(`📡 Unknown status: ${status}`);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      console.log('💓 Real-time heartbeat');
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  reset(): void {
    this.retryCount = 0;
    this.stopHeartbeat();
  }

  cleanup(): void {
    this.stopHeartbeat();
    this.retryCount = 0;
  }
}