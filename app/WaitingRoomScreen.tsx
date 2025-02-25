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
import { MOCK_PLAYERS } from '@/constants/MockPlayers';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const PlayerItem = ({ player, isCurrentUser }) => {
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
          <Text style={styles.playerInitial}>{player.name.charAt(0)}</Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName}>
              {player.name} {player.isHost && '(Host)'}
            </Text>
          </View>

          <View
            style={[
              styles.statusIndicator,
              player.isReady ? styles.readyStatus : styles.waitingStatus,
            ]}
          >
            <Text style={styles.statusText}>
              {player.isReady ? 'Listo' : 'Esperando...'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function WaitingRoomScreen({ route, navigation }) {
  const router = useRouter();
  const gameCode = route && route.params ? route.params.gameCode : '123456';

  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [isReady, setIsReady] = useState(true);
  const [countdown, setCountdown] = useState(null);

  // Simular que todos los jugadores están listos después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) => ({ ...player, isReady: true }))
      );

      // Iniciar cuenta regresiva cuando todos estén listos
      startCountdown();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const startCountdown = () => {
    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          setTimeout(() => {
            router.push('/ControllerScreen');
          }, 500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const leaveRoom = () => {
    router.push('/EntryCodeScreen');
  };

  const toggleReady = () => {
    setIsReady(!isReady);

    // Actualizar el estado del jugador actual
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === 1 ? { ...player, isReady: !isReady } : player
      )
    );

    // Si el jugador se marca como listo y todos los demás ya están listos, iniciar la cuenta regresiva
    if (!isReady) {
      const otherPlayersReady = players
        .filter((player) => player.id !== 1)
        .every((player) => player.isReady);

      if (otherPlayersReady) {
        startCountdown();
      }
    } else {
      // Si el jugador se desmarca como listo, cancelar la cuenta regresiva
      if (countdown !== null) {
        setCountdown(null);
      }
    }
  };

  // Verificar si todos están listos
  const allReady = players.every((player) => player.isReady);

  return (
    <View style={styles.container}>
      {/* Fondo con degradado */}
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
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.gameCodeContainer}>
            <Text style={styles.gameCodeLabel}>CÓDIGO DE SALA</Text>
            <Text style={styles.gameCodeValue}>{gameCode}</Text>
          </View>

          <TouchableOpacity style={styles.leaveButton} onPress={leaveRoom}>
            <LinearGradient
              colors={['#F55353', '#B22525']}
              style={styles.leaveButtonGradient}
            >
              <Text style={styles.leaveButtonText}>Abandonar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Título de sección */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Jugadores</Text>
          <Text style={styles.playerCount}>{players.length}/8</Text>
        </View>

        {/* Lista de jugadores */}
        <ScrollView
          style={styles.playersListContainer}
          contentContainerStyle={styles.playersList}
        >
          {players.map((player) => (
            <PlayerItem
              key={player.id}
              player={player}
              isCurrentUser={player.id === 1}
            />
          ))}
        </ScrollView>

        {/* Estado y botón de acción */}
        <View style={styles.bottomContainer}>
          {countdown !== null ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                Iniciando en {countdown}...
              </Text>
            </View>
          ) : (
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
          )}

          <TouchableOpacity
            style={[styles.readyButton, isReady && styles.readyButtonActive]}
            onPress={toggleReady}
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
});
