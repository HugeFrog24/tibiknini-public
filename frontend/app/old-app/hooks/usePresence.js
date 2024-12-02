import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await api.get('/presence/');
      setOnlineUsers(response.data.results || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Initialize WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/presence/`;
    
    console.log('Connecting to WebSocket URL:', wsUrl);
    
    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    
    // Create WebSocket connection through Nginx
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setRetryCount(0); // Reset retry count on successful connection
      fetchOnlineUsers(); // Fetch initial online users
      
      // Send authentication message if needed
      if (csrfToken) {
        ws.send(JSON.stringify({ type: 'authenticate', token: csrfToken }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'presence_update') {
        setOnlineUsers(prevUsers => {
          const updatedUsers = [...prevUsers];
          const userIndex = updatedUsers.findIndex(u => u.user === data.user_id);
          
          if (userIndex !== -1) {
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              is_online: data.status === 'online'
            };
          } else if (data.status === 'online') {
            fetchOnlineUsers();
          }
          
          return updatedUsers;
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Implement reconnection logic
      if (retryCount < maxRetries) {
        console.log(`Attempting to reconnect... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectWebSocket();
        }, retryDelay);
      } else {
        console.log('Max retry attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [fetchOnlineUsers, retryCount]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return () => cleanup();
  }, [connectWebSocket]);

  return { onlineUsers, isConnected };
};

export default usePresence;
