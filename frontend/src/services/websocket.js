const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

export function createPriceWebSocket({
  onMessage,
  onOpen,
  onClose,
  onError,
}) {
  const websocket = new WebSocket(`${WS_BASE_URL}/prices/ws`);

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
  };

  return {
    close: () => websocket.close(),
    get readyState() {
      return websocket.readyState;
    },
  };
}