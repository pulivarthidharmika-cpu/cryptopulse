const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

export function createPriceWebSocket({
  onMessage,
  onOpen,
  onClose,
  onError,
}) {
  let websocket = null;
  let reconnectTimer = null;
  let manuallyClosed = false;

  const connect = () => {
    if (manuallyClosed) {
      return;
    }

    websocket = new WebSocket(`${WS_BASE_URL}/prices/ws`);

    websocket.onopen = () => {
      console.log("Price WebSocket connected");
      onOpen?.();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("Price WebSocket error:", error);
      onError?.(error);
    };

    websocket.onclose = () => {
      console.log("Price WebSocket disconnected");
      onClose?.();

      if (!manuallyClosed) {
        reconnectTimer = setTimeout(() => {
          console.log("Reconnecting to price WebSocket...");
          connect();
        }, 3000);
      }
    };
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (
        websocket &&
        websocket.readyState !== WebSocket.CLOSED
      ) {
        websocket.close();
      }
    },

    get readyState() {
      return websocket
        ? websocket.readyState
        : WebSocket.CLOSED;
    },
  };
}

export function createAlertWebSocket({
  onMessage,
  onOpen,
  onClose,
  onError,
}) {
  let websocket = null;
  let reconnectTimer = null;
  let manuallyClosed = false;

  const connect = () => {
    if (manuallyClosed) {
      return;
    }

    websocket = new WebSocket(`${WS_BASE_URL}/alerts/ws`);

    websocket.onopen = () => {
      console.log("Alert WebSocket connected");
      onOpen?.();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error("Invalid Alert WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("Alert WebSocket error:", error);
      onError?.(error);
    };

    websocket.onclose = () => {
      console.log("Alert WebSocket disconnected");
      onClose?.();

      if (!manuallyClosed) {
        reconnectTimer = setTimeout(() => {
          console.log("Reconnecting to alert WebSocket...");
          connect();
        }, 3000);
      }
    };
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (
        websocket &&
        websocket.readyState !== WebSocket.CLOSED
      ) {
        websocket.close();
      }
    },

    get readyState() {
      return websocket
        ? websocket.readyState
        : WebSocket.CLOSED;
    },
  };
}