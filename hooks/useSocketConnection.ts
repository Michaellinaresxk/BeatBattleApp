'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Alert } from 'react-native';

// IMPORTANT: Use your computer's actual IP address
const SERVER_URL = 'http://192.168.1.10:3000';

export function useSocketConnection(gameCode, nickname) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Connect to socket on component mount
  useEffect(() => {
    if (!gameCode) return;

    console.log(`Connecting to ${SERVER_URL} with game code ${gameCode}`);

    try {
      // Create socket with websocket transport only for Expo compatibility
      const newSocket = io(SERVER_URL, {
        transports: ['websocket'], // Only use websocket transport
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      // Setup event handlers
      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server!', newSocket.id);
        setConnected(true);
        setError(null);
        setSocket(newSocket);

        // Join as controller
        const playerName =
          nickname || `Player${Math.floor(Math.random() * 1000)}`;
        newSocket.emit('join_controller', {
          roomCode: gameCode,
          nickname: playerName,
        });
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setConnected(false);
      });

      // Basic event handlers for room events
      newSocket.on('controller_joined', (data) => {
        console.log('Controller joined event:', data);

        if (data && data.nickname) {
          // Simple player object
          setPlayers((prev) => [...prev, data]);
        } else if (data && data.players) {
          // Full room data
          setPlayers(data.players);
        }
      });

      newSocket.on('player_ready', (data) => {
        console.log('Player ready event:', data);
        if (data && data.playerId) {
          // Update player ready status
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === data.playerId ? { ...p, isReady: data.isReady } : p
            )
          );

          // If this is about current player
          if (newSocket.id === data.playerId) {
            setIsReady(data.isReady);
          }
        }
      });

      newSocket.on('game_started', (data) => {
        console.log('Game started event:', data);
        // Navigation happens in the component
      });

      // Connect to server
      newSocket.connect();

      // Cleanup on unmount
      return () => {
        console.log('Cleaning up socket connection');
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (err) {
      console.error('Error creating socket:', err);
      setError(`Socket error: ${err.message}`);
    }
  }, [gameCode, nickname]);

  // Toggle ready state
  const toggleReady = useCallback(() => {
    if (socket && connected) {
      const newReadyState = !isReady;
      setIsReady(newReadyState);

      console.log('Toggling ready state:', newReadyState);
      socket.emit('toggle_ready', {
        roomCode: gameCode,
        isReady: newReadyState,
      });
    } else {
      console.error('Cannot toggle ready: not connected');
    }
  }, [socket, connected, isReady, gameCode]);

  // Leave room function
  const leaveRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit('leave_room', { roomCode: gameCode });
    }
  }, [socket, connected, gameCode]);

  // Retry connection function
  const retryConnection = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    // Force component re-render to trigger useEffect again
    setSocket(null);
    setConnected(false);
    setError(null);
  }, [socket]);

  return {
    socket,
    connected,
    error,
    players,
    isReady,
    toggleReady,
    leaveRoom,
    retryConnection,
    serverUrl: SERVER_URL,
  };
}
