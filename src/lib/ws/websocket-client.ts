export type WSMessageType =
  | "task_progress"
  | "generation_complete"
  | "quota_warning"
  | "chat:progress"
  | "chat:complete"
  | "chat:error"
  | "ping"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  data: unknown;
}

type MessageHandler = (message: WSMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private getToken: () => string | null;
  private handlers = new Map<WSMessageType, Set<MessageHandler>>();
  private globalHandlers = new Set<MessageHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongTime = 0;

  constructor(config: { url?: string; getToken: () => string | null }) {
    this.url = config.url || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8888/api/ws";
    this.getToken = config.getToken;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = this.getToken();
    if (!token) return;

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(`${this.url}?token=${token}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          if (message.type === "pong") {
            this.lastPongTime = Date.now();
            return;
          }
          console.log("[WS recv]", message.type, message.data);
          this.dispatch(message);
        } catch {
          // Invalid message format
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        // Error will trigger onclose
      };
    } catch {
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(type: WSMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  onAny(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private dispatch(message: WSMessage): void {
    // Type-specific handlers
    const typeHandlers = this.handlers.get(message.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => handler(message));
    }

    // Global handlers
    this.globalHandlers.forEach((handler) => handler(message));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();

    // Send ping every 30s
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);

    // Check pong freshness every 5s — if no pong in 45s (missed 1.5 ping cycles), force reconnect
    this.pongCheckTimer = setInterval(() => {
      if (Date.now() - this.lastPongTime > 45_000) {
        this.stopHeartbeat();
        this.ws?.close();
      }
    }, 5_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongCheckTimer) {
      clearInterval(this.pongCheckTimer);
      this.pongCheckTimer = null;
    }
  }
}
