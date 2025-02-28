'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocketConnection } from '@/hooks/useSocketConnection';

const { width } = Dimensions.get('window');

const PlayerItem = ({ player, isCurrentUser }) => {
  const playerId = player.id || player.playerId || '';
  const playerName = player.nickname || player.name || 'Jugador';
  const playerInitial = playerName.charAt(0).toUpperCase();
  const isPlayerHost = !!player.isHost;
  const isPlayerReady = !!player.isReady;

  return (
    <View
      style={[styles.playerItem, isCurrentUser && styles.currentPlayerItem]}
    >
      <LinearGradient
        colors={
          isCurrentUser
            ? ['rgba(95, 37, 255, 0.3)', 'rgba(95, 37, 255, 0.1)']
            : ['rgba(40, 40, 60, 0.4)', 'rgba(30, 30, 45, 0.2)']
        }
        style={styles.playerGradient}
      >
        <View style={styles.playerAvatar}>
          <Text style={styles.playerInitial}>{playerInitial}</Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName}>
              {playerName} {isPlayerHost && '(Host)'}
            </Text>
          </View>

          <View
            style={[
              styles.statusIndicator,
              isPlayerReady ? styles.readyStatus : styles.waitingStatus,
            ]}
          >
            <Text style={styles.statusText}>
              {isPlayerReady ? 'Listo' : 'Esperando...'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function WaitingRoomScreen() {
  const router = useRouter();
  const { gameCode } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Connect to socket with the game code
  const {
    socket,
    connected,
    error,
    players: socketPlayers,
    isReady,
    toggleReady,
    leaveRoom: socketLeaveRoom,
    retryConnection,
    serverUrl,
  } = useSocketConnection(gameCode);

  // Local state for players that we can update
  const [players, setPlayers] = useState([]);

  // Update players when socketPlayers changes
  useEffect(() => {
    if (socketPlayers && socketPlayers.length > 0) {
      console.log(
        '⚠️ Updating players from socketPlayers:',
        socketPlayers.length
      );
      setPlayers(socketPlayers);
    }
  }, [socketPlayers]);

  // Handle socket events
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ No socket available yet');
      return;
    }

    console.log('⚠️ Setting up socket event handlers');

    // Manejo mejorado del evento game_started
    const handleGameStarted = (data) => {
      console.log('⚠️⚠️⚠️ GAME STARTED EVENT RECEIVED:', data);
      console.log('⚠️ Current navigation state:', navigating);

      // Prevenir múltiples intentos de navegación
      if (navigating) {
        console.log('⚠️ Already navigating, ignoring duplicate event');
        return;
      }

      // Marcar que estamos navegando para evitar duplicados
      setNavigating(true);

      try {
        // Intentar la navegación con un retraso pequeño
        console.log(
          '⚠️ Intentando navegar a QuizViewScreen con código:',
          gameCode
        );

        // Emitir una alerta visible para confirmar que el evento fue recibido
        Alert.alert(
          'Juego Iniciado',
          'Preparando la pantalla de juego...',
          [{ text: 'OK', onPress: () => navigateToQuizView() }],
          { cancelable: false }
        );

        // Función para navegar después de un retraso
        const navigateToQuizView = () => {
          setTimeout(() => {
            try {
              router.push({
                pathname: '/QuizViewScreen',
                params: { gameCode },
              });
            } catch (err) {
              console.error('Error en navegación:', err);
              // Reiniciar el estado de navegación
              setNavigating(false);
              // Mostrar error al usuario
              Alert.alert(
                'Error de Navegación',
                'No se pudo navegar a la pantalla del juego. Intente nuevamente.'
              );
            }
          }, 100);
        };
      } catch (err) {
        console.error('⚠️ Error en navegación inicial:', err);
        setNavigating(false);
      }
    };

    // Registrar el manejador del evento game_started
    socket.on('game_started', handleGameStarted);

    // Otros manejadores de eventos...
    socket.on('player_joined', (player) => {
      console.log('Player joined:', player);
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === player.id);
        if (exists) return prev;
        return [...prev, player];
      });
    });

    socket.on('player_left', (data) => {
      console.log('Player left:', data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    socket.on('controller_joined', (data) => {
      console.log('⚠️ Controller joined event received:', data);

      // Procesar datos de controlador/jugador
      if (
        data &&
        data.id &&
        data.nickname &&
        !data.players &&
        !data.controllers
      ) {
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === data.id);
          if (exists) return prev;
          return [
            ...prev,
            { id: data.id, nickname: data.nickname, isReady: false },
          ];
        });
      } else if (data.controllers || data.players) {
        let newPlayers = [];

        if (data.controllers && Array.isArray(data.controllers)) {
          newPlayers = [
            ...newPlayers,
            ...data.controllers.map((c) => ({
              ...c,
              id:
                c.id ||
                c.playerId ||
                `controller-${Math.random().toString(36).substr(2, 9)}`,
            })),
          ];
        }

        if (data.players && Array.isArray(data.players)) {
          newPlayers = [
            ...newPlayers,
            ...data.players.map((p) => ({
              ...p,
              id:
                p.id ||
                p.playerId ||
                `player-${Math.random().toString(36).substr(2, 9)}`,
            })),
          ];
        }

        setPlayers(newPlayers);
      }
    });

    socket.on('controller_left', (data) => {
      console.log('Controller left:', data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.id));
    });

    socket.on('countdown_started', (data) => {
      console.log('⚠️ Countdown started:', data);
      if (data && data.seconds) setCountdown(data.seconds);
    });

    socket.on('player_ready', (data) => {
      console.log('Player ready state updated:', data);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId ? { ...p, isReady: data.isReady } : p
        )
      );
    });

    // Limpieza al desmontar
    return () => {
      console.log('⚠️ Limpiando manejadores de eventos de socket');
      socket.off('game_started', handleGameStarted);
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('controller_joined');
      socket.off('controller_left');
      socket.off('countdown_started');
      socket.off('player_ready');
    };
  }, [socket, router, gameCode, navigating]);

  const handleLeaveRoom = useCallback(() => {
    socketLeaveRoom();
    router.push('/EntryCodeScreen');
  }, [socketLeaveRoom, router]);

  const handleToggleReady = useCallback(() => {
    if (toggleReady) {
      console.log('⚠️ Toggling ready state, current state:', isReady);
      toggleReady();
    } else {
      console.error('toggleReady function not available');
      Alert.alert('Error', 'Cannot toggle ready state. Please try again.');
    }
  }, [toggleReady, isReady]);

  // Añadir botón para forzar la navegación (DEBUG)
  const forceNavigate = useCallback(() => {
    try {
      console.log('⚠️ Navegación forzada a QuizViewScreen');
      router.push({
        pathname: '/QuizViewScreen',
        params: { gameCode },
      });
    } catch (err) {
      console.error('Error en navegación forzada:', err);
      Alert.alert('Error', 'No se pudo navegar: ' + err.message);
    }
  }, [router, gameCode]);

  // Find current player (this device)
  const currentPlayer = players.find((p) => socket && p.id === socket.id);
  const allReady = players.length > 0 && players.every((p) => p.isReady);

  // Render error state
  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorDetailText}>
            Server: {serverUrl}
            {'\n'}
            Game Code: {gameCode}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('⚠️ Retrying connection');
              retryConnection();
            }}
          >
            <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => {
              console.log('⚠️ Returning to entry screen');
              router.push('/EntryCodeScreen');
            }}
          >
            <LinearGradient
              colors={['#F55353', '#B22525']}
              style={styles.leaveButtonGradient}
            >
              <Text style={styles.leaveButtonText}>Volver</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render loading state
  if (!connected) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#5F25FF' />
          <Text style={styles.loadingText}>Conectando al servidor...</Text>
          <Text style={styles.loadingDetailText}>
            Server: {serverUrl}
            {'\n'}
            Game Code: {gameCode}
          </Text>
        </View>
      </View>
    );
  }

  // Render main waiting room UI
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.gameCodeContainer}>
            <Text style={styles.gameCodeLabel}>CÓDIGO DE SALA</Text>
            <Text style={styles.gameCodeValue}>{gameCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRoom}
          >
            <LinearGradient
              colors={['#F55353', '#B22525']}
              style={styles.leaveButtonGradient}
            >
              <Text style={styles.leaveButtonText}>Abandonar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Jugadores</Text>
          <Text style={styles.playerCount}>{players.length}/8</Text>
        </View>

        <ScrollView
          style={styles.playersListContainer}
          contentContainerStyle={styles.playersList}
        >
          {players.map((player, index) => (
            <PlayerItem
              key={player.id || `player-${index}`}
              player={player}
              isCurrentUser={
                socket &&
                (player.id === socket.id || player.playerId === socket.id)
              }
            />
          ))}

          {players.length === 0 && (
            <View style={styles.noPlayersContainer}>
              <Text style={styles.noPlayersText}>
                Esperando a que se unan jugadores...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Countdown display if active */}
        {countdown !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              El juego comienza en: {countdown}
            </Text>
          </View>
        )}

        {/* Status and action button */}
        <View style={styles.bottomContainer}>
          <View style={styles.statusContainer}>
            {allReady ? (
              <Text style={styles.allReadyText}>
                Todos los jugadores están listos
              </Text>
            ) : (
              <Text style={styles.waitingOthersText}>
                Esperando a que todos estén listos...
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.readyButton, isReady && styles.readyButtonActive]}
            onPress={handleToggleReady}
          >
            <LinearGradient
              colors={isReady ? ['#4caf50', '#2e7d32'] : ['#414151', '#2A2A36']}
              style={styles.readyButtonGradient}
            >
              <Text style={styles.readyButtonText}>
                {isReady ? '¡Estoy Listo!' : 'No Estoy Listo'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* DEBUG: Botón para forzar la navegación */}
        {__DEV__ && (
          <TouchableOpacity style={styles.debugButton} onPress={forceNavigate}>
            <Text style={styles.debugButtonText}>
              Forzar Navegación (DEBUG)
            </Text>
          </TouchableOpacity>
        )}

        {/* Connection info for debugging */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Connected to: {serverUrl}
              {'\n'}
              Socket ID: {socket?.id || 'N/A'}
              {'\n'}
              Players: {players.length}
              {'\n'}
              Navigation State: {navigating ? 'Navegando' : 'Esperando'}
            </Text>
            {debugInfo && (
              <Text style={styles.debugText}>Debug Info: {debugInfo}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F19',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(95, 37, 255, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 255, 0.1)',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  gameCodeContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameCodeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  gameCodeValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  leaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaveButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: 'rgba(95, 37, 255, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  playerCount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  playersListContainer: {
    flex: 1,
  },
  playersList: {
    paddingBottom: 20,
  },
  playerItem: {
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  currentPlayerItem: {
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  playerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(95, 37, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readyStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  waitingStatus: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomContainer: {
    marginTop: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  allReadyText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '500',
  },
  waitingOthersText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '500',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(95, 37, 255, 0.2)',
    borderRadius: 12,
    padding: 10,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  readyButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  readyButtonActive: {
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  readyButtonGradient: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  readyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F55353',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorDetailText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 15,
    marginBottom: 10,
  },
  loadingDetailText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  noPlayersContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 40, 60, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
  },
  noPlayersText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  debugButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
  },
});
