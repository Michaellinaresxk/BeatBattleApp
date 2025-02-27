'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Alert, Platform } from 'react-native';

// Get appropriate server URL based on platform
// const getServerUrl = () => {
//   // For iOS simulator, use localhost
//   if (Platform.OS === 'ios') {
//     // iOS simulator can use localhost
//     return 'http://localhost:3000';
//   }
//   // For Android emulator, use 10.0.2.2 (special IP that routes to host's localhost)
//   else if (Platform.OS === 'android') {
//     return 'http://10.0.2.2:3000';
//   }
//   // For physical devices, use the actual network IP of your development machine
//   return 'http://192.168.1.10:3000';
// };

// Use the platform-specific server URL
// const SERVER_URL = getServerUrl();

const SERVER_URL = 'http://192.168.1.10:3000';

export function useSocketConnection(gameCode: string, nickname?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    // Only try to connect if we have a game code
    if (!gameCode) return;

    // Generate random nickname if not provided
    const playerNickname =
      nickname || `Player${Math.floor(Math.random() * 1000)}`;

    console.log(`⚠️ Attempting connection to server: ${SERVER_URL}`);
    console.log(`⚠️ Room code: ${gameCode}`);
    console.log(`⚠️ Nickname: ${playerNickname}`);

    let socketInstance: Socket | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connectSocket = () => {
      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        const errorMsg = `Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check your connection.`;
        setError(errorMsg);
        Alert.alert('Connection Error', errorMsg);
        return;
      }

      // Close previous socket if it exists
      if (socketInstance) {
        socketInstance.close();
      }

      // Increment connection attempts
      setConnectionAttempts((prev) => prev + 1);

      // Create new socket connection
      try {
        socketInstance = io(SERVER_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          forceNew: true,
        });

        // Connection event handlers
        socketInstance.on('connect', () => {
          console.log(`✅ Connected to server with ID: ${socketInstance?.id}`);
          setConnected(true);
          setError(null);
          setConnectionAttempts(0); // Reset connection attempts on success
          setSocket(socketInstance);

          // Join room as mobile controller
          console.log(`⚠️ Emitting join_controller with:`, {
            roomCode: gameCode,
            nickname: playerNickname,
          });

          socketInstance?.emit('join_controller', {
            roomCode: gameCode,
            nickname: playerNickname,
          });
        });

        socketInstance.on('connect_error', (err) => {
          console.error(`❌ Connection error: ${err.message}`);
          setError(`Connection error: ${err.message}`);
          setConnected(false);

          // Try again with exponential backoff
          const backoffTime = Math.min(
            1000 * Math.pow(2, connectionAttempts),
            10000
          );
          console.log(`Retrying in ${backoffTime / 1000} seconds...`);

          // Close socket for clean retry
          socketInstance?.close();

          // Retry after backoff
          retryTimeout = setTimeout(() => {
            connectSocket();
          }, backoffTime);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log(`🔌 Disconnected from server. Reason: ${reason}`);
          setConnected(false);

          if (reason === 'io server disconnect') {
            // The server forcefully disconnected, reconnect manually
            console.log('Server disconnected us, trying to reconnect...');
            socketInstance?.connect();
          } else if (
            reason === 'transport close' ||
            reason === 'ping timeout'
          ) {
            // Connection lost, try to reconnect after a delay
            console.log('Connection lost, trying to reconnect...');
            retryTimeout = setTimeout(() => {
              connectSocket();
            }, 1000);
          }
        });

        // Handle controller-specific events
        socketInstance.on('controller_joined', (data) => {
          console.log('⚠️ Controller joined, data received:', data);

          let newPlayers = [];

          // If there are controllers, use them
          if (data.controllers && Array.isArray(data.controllers)) {
            console.log('⚠️ Controllers detected:', data.controllers.length);
            newPlayers = data.controllers.map((controller) => ({
              ...controller,
              // Ensure each controller has a unique id for React
              id:
                controller.id ||
                controller.playerId ||
                `controller-${Math.random().toString(36).substr(2, 9)}`,
            }));
          }

          // If there are players, add them too
          if (data.players && Array.isArray(data.players)) {
            console.log('⚠️ Players detected:', data.players.length);
            newPlayers = [
              ...newPlayers,
              ...data.players.map((player) => ({
                ...player,
                id:
                  player.id ||
                  player.playerId ||
                  `player-${Math.random().toString(36).substr(2, 9)}`,
              })),
            ];
          }

          console.log('⚠️ Final player list:', newPlayers.length);
          setPlayers(newPlayers);
        });

        // Handle ready state updates
        socketInstance.on('player_ready', (data) => {
          console.log('⚠️ Player ready event received:', data);

          // Update state for the specific player
          if (data.playerId === socketInstance?.id) {
            console.log('⚠️ Updating own ready state to:', data.isReady);
            setIsReady(data.isReady);
          }

          // Also update the players list
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === data.playerId ? { ...p, isReady: data.isReady } : p
            )
          );
        });

        // Handle countdown event
        socketInstance.on('countdown_started', (data) => {
          console.log('⚠️ Countdown started event received in hook:', data);
        });

        // Handle game start event
        socketInstance.on('game_started', (data) => {
          console.log('⚠️ Game started event received in hook:', data);
        });

        // Handle server errors
        socketInstance.on('error', (data) => {
          console.error('Error from server:', data.message);
          setError(data.message);

          Alert.alert('Error', data.message);
        });

        // Handle ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (socketInstance?.connected) {
            socketInstance.emit('ping');
          }
        }, 25000); // Ping every 25 seconds to keep connection alive

        // Clean up ping interval on unmount
        return () => {
          clearInterval(pingInterval);
        };
      } catch (err) {
        console.error('Error creating socket:', err);
        setError(
          `Error creating socket: ${
            err instanceof Error ? err.message : String(err)
          }`
        );

        // Retry after a delay
        retryTimeout = setTimeout(() => {
          connectSocket();
        }, 2000);
      }
    };

    // Start connection process
    connectSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (socketInstance) {
        // Remove all listeners to prevent memory leaks
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('disconnect');
        socketInstance.off('controller_joined');
        socketInstance.off('player_ready');
        socketInstance.off('countdown_started');
        socketInstance.off('game_started');
        socketInstance.off('error');
        socketInstance.disconnect();
      }
    };
  }, [gameCode, nickname, connectionAttempts]);

  // Toggle ready state
  const toggleReady = useCallback(() => {
    if (socket && connected) {
      const newReadyState = !isReady;
      console.log('⚠️ Sending toggle_ready with state:', newReadyState);
      console.log('⚠️ Room code:', gameCode);

      // Update local state first for immediate feedback
      setIsReady(newReadyState);

      // Send event to server
      socket.emit('toggle_ready', {
        roomCode: gameCode,
        isReady: newReadyState,
      });
    } else {
      console.error('⚠️ Cannot send toggle_ready, socket not connected');
      if (!socket) console.error('⚠️ Socket is null');
      if (!connected) console.error('⚠️ Not connected');
    }
  }, [socket, connected, isReady, gameCode]);

  // Function to leave the room
  const leaveRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit('leave_room', { roomCode: gameCode });
    }
  }, [socket, connected, gameCode]);

  return {
    socket,
    connected,
    error,
    players,
    isReady,
    toggleReady,
    leaveRoom,
    serverUrl: SERVER_URL, // Expose server URL for debugging
  };
}
