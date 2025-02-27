'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
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

  // Conectar al socket con el código de juego
  const {
    socket,
    connected,
    error,
    players: socketPlayers,
    isReady,
    toggleReady,
    leaveRoom: socketLeaveRoom,
  } = useSocketConnection(gameCode as string);

  // Estado local de jugadores que podemos actualizar
  const [players, setPlayers] = useState([]);

  // Actualizar jugadores cuando socketPlayers cambia
  useEffect(() => {
    if (socketPlayers && socketPlayers.length > 0) {
      setPlayers(socketPlayers);
    }
  }, [socketPlayers]);

  // Manejar eventos del socket
  useEffect(() => {
    if (!socket) return;

    // Manejar evento de jugador unido
    socket.on('player_joined', (player) => {
      console.log('Jugador unido:', player);
      setPlayers((prev) => [...prev, player]);
    });

    // Manejar evento de jugador que abandona
    socket.on('player_left', (data) => {
      console.log('Jugador abandonó:', data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    // Manejar evento de controlador unido
    socket.on('controller_joined', (data) => {
      if (!Array.isArray(data)) {
        // Un solo controlador se unió
        console.log('Controlador unido:', data);
        setPlayers((prev) => [
          ...prev,
          {
            id: data.id,
            nickname: data.nickname,
            isReady: false,
          },
        ]);
      }
    });

    // Manejar evento de controlador que abandona
    socket.on('controller_left', (data) => {
      console.log('Controlador abandonó:', data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.id));
    });

    // Manejar evento de inicio de cuenta regresiva
    socket.on('countdown_started', (data) => {
      console.log('⚠️ Countdown started event received in WaitingRoom:', data);
      if (data && data.seconds) {
        setCountdown(data.seconds);
      }
    });

    // Manejar evento de inicio de juego
    socket.on('game_started', (data) => {
      console.log('⚠️⚠️⚠️ GAME STARTED EVENT RECEIVED IN EXPO:', data);
      console.log('⚠️⚠️⚠️ Current route:', router.pathname);

      // Intentar navegar directamente
      console.log('⚠️⚠️⚠️ Attempting to navigate to QuizControllerScreen');
      router.push({
        pathname: '/QuizControllerScreen',
        params: { gameCode },
      });
    });

    // Manejar actualizaciones del estado "listo"
    socket.on('player_ready', (data) => {
      console.log('Estado listo del jugador actualizado:', data);
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id === data.playerId) {
            console.log('⚠️ Actualizando estado listo del jugador:', {
              before: p.isReady,
              after: data.isReady,
            });
            return { ...p, isReady: data.isReady };
          }
          return p;
        });
      });

      // Si es el jugador actual, asegurarnos de que el botón refleje el estado
      if (socket.id === data.playerId) {
        console.log('⚠️ Actualizando estado listo propio:', data.isReady);
      }
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('controller_joined');
      socket.off('controller_left');
      socket.off('countdown_started');
      socket.off('game_started');
      socket.off('player_ready');
    };
  }, [socket, router, gameCode]);

  const handleLeaveRoom = () => {
    socketLeaveRoom();
    router.push('/EntryCodeScreen');
  };

  const handleToggleReady = () => {
    toggleReady();
  };

  // Encontrar jugador actual (este dispositivo)
  const currentPlayer = players.find((p) => socket && p.id === socket.id);
  const allReady = players.length > 0 && players.every((p) => p.isReady);

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
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => router.push('/EntryCodeScreen')}
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
          <Text style={styles.loadingText}>Conectando al servidor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Elementos decorativos */}
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
              key={player.id || player.playerId || `player-${index}`} // Asegurar una key única siempre
              player={player}
              isCurrentUser={
                socket &&
                (player.id === socket.id || player.playerId === socket.id)
              }
            />
          ))}
        </ScrollView>

        {/* Estado y botón de acción */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
});
