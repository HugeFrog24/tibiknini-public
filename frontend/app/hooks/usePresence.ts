import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import UserContext from '../contexts/UserContext';

interface OnlineUser {
  user: string;
  is_online: boolean;
  status: 'online' | 'away' | 'offline';
}

const usePresence = () => {
  const { user, isAuthenticated, isLoading } = useContext(UserContext);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds

  const connectWebSocket = useCallback(() => {
    // Only connect if user is authenticated and loading is complete
    if (isLoading || !isAuthenticated || !user) {
      return () => {};
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/presence/`;
    
    console.log('Connecting to presence WebSocket...');
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Presence WebSocket connected');
      setIsConnected(true);
      retryCountRef.current = 0;

      // Send initial presence status
      ws.send(JSON.stringify({
        type: 'presence',
        status: 'online',
        user_id: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence_update') {
          setOnlineUsers(prevUsers => {
            const updatedUsers = [...prevUsers];
            const userIndex = updatedUsers.findIndex(u => u.user === data.user_id.toString());
            
            if (userIndex !== -1) {
              updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                is_online: data.status === 'online',
                status: data.status
              };
            } else {
              updatedUsers.push({
                user: data.user_id.toString(),
                is_online: data.status === 'online',
                status: data.status
              });
            }
            
            // Sort users by online status and then by user ID
            return updatedUsers.sort((a, b) => {
              if (a.is_online === b.is_online) {
                return a.user.localeCompare(b.user);
              }
              return a.is_online ? -1 : 1;
            });
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Presence WebSocket disconnected');
      setIsConnected(false);
      
      if (retryCountRef.current < maxRetries) {
        console.log(`Attempting to reconnect... (${retryCountRef.current + 1}/${maxRetries})`);
        setTimeout(() => {
          retryCountRef.current += 1;
          connectWebSocket();
        }, retryDelay);
      } else {
        console.log('Max retry attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('Presence WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(ws);

    // Cleanup function
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send offline status before closing
        ws.send(JSON.stringify({
          type: 'presence',
          status: 'offline',
          user_id: user.id
        }));
        ws.close();
      }
    };
  }, [isAuthenticated, user, isLoading]);

  // Connect WebSocket when component mounts or when auth status changes
  useEffect(() => {
    const cleanup = connectWebSocket();
    return () => cleanup();
  }, [connectWebSocket]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!socket || !user) return;

      const status = document.hidden ? 'away' : 'online';
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'presence',
          status,
          user_id: user.id
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, user]);

  return { onlineUsers, isConnected };
};

export default usePresence;
