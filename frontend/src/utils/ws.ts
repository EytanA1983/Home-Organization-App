let socket: WebSocket | null = null;

/**
 * Get WebSocket URL from API URL
 * Converts http://localhost:8000 -> ws://localhost:8000
 * Converts https://example.com -> wss://example.com
 */
const getWsUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const wsUrl = apiUrl.replace(/^http/, 'ws');
  return `${wsUrl}/ws`;
};

export const connectWs = (onMessage: (msg: any) => void) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found, cannot connect to WebSocket');
    return;
  }

  const wsUrl = `${getWsUrl()}?token=${token}`;
  console.log('Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WS connected');
    // ניתן לשלוח הודעה ראשונית אם דרוש
  };
  
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = (event) => {
    console.warn('WS closed', { code: event.code, reason: event.reason });
    // Reconnect after 5 seconds if not a normal closure
    if (event.code !== 1000) {
      setTimeout(() => connectWs(onMessage), 5000);
    }
  };
};

export const sendWs = (payload: any) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    console.warn('WebSocket is not connected, cannot send message');
  }
};

export const disconnectWs = () => {
  if (socket) {
    socket.close(1000, 'Client disconnect');
    socket = null;
  }
};
