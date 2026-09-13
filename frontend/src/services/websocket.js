const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

/**
 * Universal managed WebSocket client with:
 * - Exponential backoff retry logic (initial 1s, backoff x1.8, max 30s)
 * - Proactive ping/pong heartbeat watchdog (30s interval, 10s timeout)
 * - Browser online/offline event listeners for immediate network recovery
 * - Structured connection state callbacks
 * - Graceful clean teardown
 */
export function createManagedWebSocket({
  endpoint,
  name = "WebSocket",
  onMessage,
  onOpen,
  onClose,
  onError,
  onStateChange,
  heartbeatIntervalMs = 30000,
  heartbeatTimeoutMs = 10000,
  initialDelayMs = 1000,
  maxDelayMs = 30000,
  backoffFactor = 1.8,
}) {
  let websocket = null;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let heartbeatTimeoutTimer = null;
  let manuallyClosed = false;
  let retryCount = 0;
  let currentDelay = initialDelayMs;
  let currentState = "DISCONNECTED";

  const setState = (newState) => {
    currentState = newState;
    onStateChange?.(newState, { retryCount, currentDelay });
  };

  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimeoutTimer = null;
    }
  };

  const startHeartbeat = () => {
    clearHeartbeat();

    heartbeatTimer = setInterval(() => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        try {
          websocket.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));

          // Start watchdog timer: if pong not received within timeout, force reconnect
          if (heartbeatTimeoutTimer) clearTimeout(heartbeatTimeoutTimer);
          heartbeatTimeoutTimer = setTimeout(() => {
            console.warn(`[${name}] Heartbeat timeout expired. Terminating stale connection.`);
            if (websocket) {
              websocket.close(4000, "Heartbeat timeout");
            }
          }, heartbeatTimeoutMs);
        } catch (err) {
          console.error(`[${name}] Heartbeat ping send failed:`, err);
        }
      }
    }, heartbeatIntervalMs);
  };

  const scheduleReconnect = () => {
    if (manuallyClosed || reconnectTimer) {
      return;
    }

    setState("RECONNECTING");
    retryCount += 1;
    const delay = Math.min(
      Math.round(currentDelay + Math.random() * 500),
      maxDelayMs
    );
    currentDelay = Math.min(currentDelay * backoffFactor, maxDelayMs);

    console.log(
      `[${name}] Reconnecting in ${delay}ms (attempt #${retryCount})...`
    );

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const handleOnline = () => {
    if (manuallyClosed) return;
    console.log(`[${name}] Browser came online. Reconnecting immediately.`);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    currentDelay = initialDelayMs;
    connect();
  };

  const handleOffline = () => {
    console.warn(`[${name}] Browser went offline.`);
    setState("OFFLINE");
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }

  const connect = () => {
    if (manuallyClosed) {
      return;
    }

    setState(retryCount === 0 ? "CONNECTING" : "RECONNECTING");

    try {
      const fullUrl = `${WS_BASE_URL}${endpoint}`;
      websocket = new WebSocket(fullUrl);

      websocket.onopen = () => {
        console.log(`[${name}] Connected to ${endpoint}`);
        retryCount = 0;
        currentDelay = initialDelayMs;
        setState("CONNECTED");
        startHeartbeat();
        onOpen?.();
      };

      websocket.onmessage = (event) => {
        try {
          // Check for heartbeat pong response
          if (event.data === "pong" || event.data === '{"type":"pong"}') {
            if (heartbeatTimeoutTimer) {
              clearTimeout(heartbeatTimeoutTimer);
              heartbeatTimeoutTimer = null;
            }
            return;
          }

          const data = JSON.parse(event.data);

          if (data && data.type === "pong") {
            if (heartbeatTimeoutTimer) {
              clearTimeout(heartbeatTimeoutTimer);
              heartbeatTimeoutTimer = null;
            }
            return;
          }

          onMessage?.(data);
        } catch (error) {
          console.error(`[${name}] Invalid WebSocket message payload:`, error);
        }
      };

      websocket.onerror = (error) => {
        console.error(`[${name}] WebSocket error:`, error);
        setState("ERROR");
        onError?.(error);
      };

      websocket.onclose = (event) => {
        console.log(`[${name}] Disconnected (code: ${event.code}, reason: ${event.reason || "none"})`);
        clearHeartbeat();
        setState("DISCONNECTED");
        onClose?.(event);

        if (!manuallyClosed) {
          scheduleReconnect();
        }
      };
    } catch (err) {
      console.error(`[${name}] Connection initialization failed:`, err);
      scheduleReconnect();
    }
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;
      clearHeartbeat();

      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (
        websocket &&
        websocket.readyState !== WebSocket.CLOSED &&
        websocket.readyState !== WebSocket.CLOSING
      ) {
        websocket.close();
      }

      setState("DISCONNECTED");
    },

    reconnect: () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (websocket) {
        websocket.close();
      }
      currentDelay = initialDelayMs;
      connect();
    },

    send: (data) => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        websocket.send(payload);
        return true;
      }
      return false;
    },

    get state() {
      return currentState;
    },

    get retryCount() {
      return retryCount;
    },

    get readyState() {
      return websocket ? websocket.readyState : WebSocket.CLOSED;
    },
  };
}

export function createPriceWebSocket(options) {
  return createManagedWebSocket({
    ...options,
    endpoint: "/prices/ws",
    name: "Price WebSocket",
  });
}

export function createAlertWebSocket(options) {
  return createManagedWebSocket({
    ...options,
    endpoint: "/alerts/ws",
    name: "Alert WebSocket",
  });
}