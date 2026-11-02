import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) return;

    // We pass the token for authentication to the socket server
    const token = localStorage.getItem('token');
    
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    });

    setSocket(newSocket);

    // Join appropriate room based on role
    newSocket.on('connect', () => {
      if (user.role === 'ADMIN') {
        newSocket.emit('join_room', 'admin');
      } else if (user.role === 'TEACHER') {
        newSocket.emit('join_room', `teacher:${user.id}`);
      } else if (user.role === 'STUDENT') {
        newSocket.emit('join_room', `student:${user.id}`);
      }
    });

    // Common event for receiving AI detection alerts
    newSocket.on('ai_alert', (alertData) => {
      console.log('AI Alert Received via Socket:', alertData);
      setActiveAlerts((prev) => [alertData, ...prev].slice(0, 50)); // Keep last 50 alerts
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, activeAlerts, setActiveAlerts }}>
      {children}
    </SocketContext.Provider>
  );
};
