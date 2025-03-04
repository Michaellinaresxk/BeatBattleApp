'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocketConnection } from '../hooks/useSocketConnection';

export default function WaitingRoomScreen() {
  const router = useRouter();
  const { gameCode, nickname } = useLocalSearchParams();
  const [playerName, setPlayerName] = useState(nickname || '');
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Socket connection
  const {
    connected,
    error,
    players,
    isReady,
    toggleReady,
    leaveRoom,
    retryConnection,
    socket,
    gameStarted,
    gameStatus,
    selectedCategory,
    selectedCategoryType,
  } = useSocketConnection(gameCode, playerName);

  // Listen for game status changes to redirect
  useEffect(() => {
    // Revisar si el juego ha iniciado o si todos los jugadores están listos
    if (gameStarted || gameStatus === 'playing') {
      console.log('Navegando a ControllerScreen debido a inicio de juego', {
        gameCode,
        gameStatus,
        gameStarted,
      });

      router.push({
        pathname: '/ControllerScreen',
        params: {
          gameCode,
          nickname: playerName,
        },
      });
    }

    // Verificar si el usuario está listo y debe ir a ControllerScreen
    if (isReady) {
      console.log('Usuario marcado como listo, navegando a ControllerScreen');

      router.push({
        pathname: '/ControllerScreen',
        params: {
          gameCode,
          nickname: playerName,
        },
      });
    }
  }, [gameStarted, gameStatus, isReady, gameCode, playerName, router]);
  // Handle connection errors
  useEffect(() => {
    if (error) {
      Alert.alert('Connection Error', `Unable to connect: ${error}`, [
        {
          text: 'Retry',
          onPress: () => {
            setIsReconnecting(true);
            retryConnection();

            // Set a timeout to stop the reconnecting state if it takes too long
            setTimeout(() => {
              setIsReconnecting(false);
            }, 10000);
          },
        },
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    }
  }, [error, retryConnection, router]);

  // Reset reconnecting state when connection is established
  useEffect(() => {
    if (connected && isReconnecting) {
      setIsReconnecting(false);
    }
  }, [connected, isReconnecting]);

  // Handle back press - confirm leave
  const handleLeaveRoom = () => {
    Alert.alert('Leave Room', 'Are you sure you want to leave this game?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          leaveRoom();
          router.push('/');
        },
      },
    ]);
  };

  useEffect(() => {
    if (gameStarted || gameStatus === 'playing') {
      router.push({
        pathname: '/ControllerScreen',
        params: {
          gameCode,
          nickname,
        },
      });
    }
  }, [gameStarted, gameStatus, gameCode, nickname, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        style={styles.background}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Waiting Room</Text>
        <Text style={styles.roomCode}>Room: {gameCode}</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Connection Status</Text>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: connected ? '#4CAF50' : '#F44336' },
            ]}
          />
          <Text style={styles.statusText}>
            {isReconnecting
              ? 'Reconnecting...'
              : connected
              ? 'Connected'
              : 'Connecting...'}
          </Text>
        </View>

        {selectedCategory || selectedCategoryType ? (
          <View style={styles.categoryInfo}>
            <Text style={styles.infoLabel}>Game Details:</Text>
            {selectedCategoryType && (
              <Text style={styles.infoText}>Type: {selectedCategoryType}</Text>
            )}
            {selectedCategory && (
              <Text style={styles.infoText}>Category: {selectedCategory}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Players ({players.length})</Text>
          {players.length === 0 && connected ? (
            <View style={styles.emptyPlayers}>
              <Text style={styles.emptyText}>
                Waiting for other players to join...
              </Text>
              <ActivityIndicator color='#5F25FF' style={{ marginTop: 10 }} />
            </View>
          ) : (
            <ScrollView style={styles.playersList}>
              {players.map((player, index) => (
                <View key={index} style={styles.playerItem}>
                  <View
                    style={[
                      styles.playerAvatar,
                      {
                        backgroundColor: player.isReady
                          ? '#4CAF50'
                          : 'rgba(95, 37, 255, 0.7)',
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {player.nickname?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>
                    {player.nickname || `Player ${index + 1}`}
                  </Text>
                  {player.isHost && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostText}>Host</Text>
                    </View>
                  )}
                  {player.isReady && (
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyText}>Ready</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.infoMessage}>
          <Text style={styles.infoText}>
            Waiting for the host to select game type and start the game
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.readyButton,
              {
                backgroundColor: isReady ? '#4CAF50' : 'rgba(95, 37, 255, 0.7)',
              },
            ]}
            onPress={toggleReady}
            disabled={!connected || isReconnecting}
          >
            <Text style={styles.buttonText}>
              {isReady ? 'Ready!' : 'Ready Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRoom}
          >
            <Text style={styles.buttonText}>Leave Room</Text>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  roomCode: {
    fontSize: 18,
    color: '#c2c2c2',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  statusText: {
    color: '#c2c2c2',
    fontSize: 14,
  },
  categoryInfo: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#c2c2c2',
    fontSize: 14,
  },
  playersContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  hostText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  readyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoMessage: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  emptyPlayers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#c2c2c2',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readyButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  leaveButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
