'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSocketConnection } from '../hooks/useSocketConnection';

const { width, height } = Dimensions.get('window');

export default function ControllerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { gameCode, nickname } = useLocalSearchParams();
  const [lastPressed, setLastPressed] = useState('');
  const [activeButton, setActiveButton] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const localSocketRef = useRef(null);
  const [gameInfo, setGameInfo] = useState({
    status: 'waiting',
    message: 'Waiting for the host to start the game...',
    currentScreen: 'waiting',
  });

  const {
    socket,
    connected,
    error,
    selectedCategory,
    selectedCategoryType,
    gameStarted,
    gameStatus,
    currentQuestion,
    selectionComplete,
    submitAnswer,
    leaveRoom,
    retryConnection,
  } = useSocketConnection(gameCode as string, nickname as string);

  useEffect(() => {
    console.log('Initialization data:', { gameCode, nickname });
    if (!gameCode || !nickname) {
      console.warn('Incomplete data for socket connection');
    }
  }, [gameCode, nickname]);

  useEffect(() => {
    if (!connected && !error) {
      console.log('Waiting for server connection on ControllerScreen...');
    } else if (connected) {
      console.log('Connection established in ControllerScreen!');
    }
  }, [connected, error]);

  // Listen to updates on the current screen
  useEffect(() => {
    if (!socket || !connected) return;

    const handleScreenChange = (data) => {
      console.log('Changed screen:', data);
      setGameInfo((prev) => ({
        ...prev,
        currentScreen: data.screen || prev.currentScreen,
        options: data.options || [],
      }));
    };

    socket.on('screen_changed', handleScreenChange);

    return () => {
      socket.off('screen_changed', handleScreenChange);
    };
  }, [socket, connected]);

  // Watch for game status changes
  useEffect(() => {
    if (gameStatus === 'playing') {
      setGameInfo((prev) => ({
        ...prev,
        status: 'playing',
        message: 'Game in progress!',
      }));
    } else if (gameStatus === 'ended') {
      setGameInfo((prev) => ({
        ...prev,
        status: 'ended',
        message: 'Game has ended!',
      }));
    }
  }, [gameStatus]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Connection Error',
        `Could not connect to the server: ${error}`,
        [
          {
            text: 'Retry',
            onPress: () => retryConnection(),
          },
          {
            text: 'Back to',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [error, router, retryConnection]);

  // Handle controller events - Improve with useCallback to avoid redeclarations
  const handleDirectionPress = useCallback(
    (direction) => {
      setLastPressed(direction);
      setActiveButton(direction);
      Vibration.vibrate(30);

      if (socket && connected) {
        console.log(`Sending address: ${direction}  for room ${gameCode}`);

        // Send both formats to ensure compatibility
        socket.emit('controller_direction', {
          roomCode: gameCode,
          direction: direction,
        });

        socket.emit('send_controller_command', {
          roomCode: gameCode,
          action: 'move',
          direction: direction,
        });
      }

      setTimeout(() => {
        setActiveButton(null);
      }, 200);
    },
    [socket, connected, gameCode]
  );

  // Manage center button press
  const handleCenterPress = useCallback(() => {
    setLastPressed('enter');
    setActiveButton('enter');
    Vibration.vibrate(50);

    console.log('Attempting to send ENTER');
    console.log(`Socket connected: ${!!socket}`);
    console.log(`Connection: ${connected}`);
    console.log(`Room code: ${gameCode}`);

    if (socket && connected && gameCode) {
      console.log(`Sending controller_enter to room ${gameCode}`);
      socket.emit('controller_enter', {
        roomCode: gameCode,
      });
    } else {
      console.warn(
        'Unable to send command: Socket not connected or missing room code'
      );
    }

    setTimeout(() => {
      setActiveButton(null);
    }, 200);
  }, [socket, connected, gameCode]);

  useEffect(() => {
    if (!socket) return;

    const handleScreenChange = (data) => {
      console.log('Web screen changed:', data);
      setGameInfo((prev) => ({
        ...prev,
        currentScreen: data.screen || prev.currentScreen,
      }));
    };

    socket.on('screen_changed', handleScreenChange);

    return () => {
      socket.off('screen_changed', handleScreenChange);
    };
  }, [socket]);

  // Abrir menú
  const openMenu = useCallback(() => {
    Alert.alert('Game Menu', 'What would you like to do?', [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'Leave Game',
        style: 'destructive',
        onPress: () => {
          leaveRoom();
          router.push('/');
        },
      },
    ]);
  }, [leaveRoom, router]);

  // Get current category information
  const getCategoryInfo = useCallback(() => {
    if (selectedCategoryType && selectedCategory) {
      return `${selectedCategoryType} - ${selectedCategory}`;
    } else if (selectedCategoryType) {
      return selectedCategoryType;
    } else if (selectedCategory) {
      return selectedCategory;
    }
    return 'No category selected';
  }, [selectedCategoryType, selectedCategory]);

  // Show current screen
  const getCurrentScreenInfo = useCallback(() => {
    return `Screen: ${gameInfo.currentScreen || 'unknown'}`;
  }, [gameInfo.currentScreen]);

  // Critical fix: Listen for game_started event and navigate to QuizViewScreen
  // ONLY when selection is complete
  useEffect(() => {
    if (!socket || !connected) return;

    const handleGameStarted = (data) => {
      console.log('🎮 game_started event received on ControllerScreen:', data);

      // Verificar si tenemos toda la información necesaria para comenzar
      const hasCategory = data.category || selectedCategory;
      const hasCategoryType = data.categoryType || selectedCategoryType;
      const isGameReady = data.gameReady === true;

      console.log('Game start conditions:', {
        hasCategory,
        hasCategoryType,
        isGameReady,
        selectionComplete,
      });

      // Solo navegar si el juego está realmente listo para comenzar
      if (isGameReady && hasCategory && hasCategoryType) {
        console.log(
          '📱 Game started with complete selection, navigating to QuizViewScreen'
        );

        // Add a small delay to ensure the server has time to prepare the question
        setTimeout(() => {
          router.push({
            pathname: '/QuizViewScreen',
            params: {
              gameCode: gameCode,
              nickname: nickname,
            },
          });
        }, 500);
      } else {
        console.log('Not navigating yet - waiting for complete selection');
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [
    socket,
    connected,
    gameCode,
    nickname,
    router,
    selectedCategory,
    selectedCategoryType,
    selectionComplete,
  ]);

  // Monitorear cambios en selectionComplete para navegar cuando esté listo
  useEffect(() => {
    if (selectionComplete && gameStarted) {
      console.log(
        'Selection complete and game started, navigating to QuizViewScreen'
      );
      router.push({
        pathname: '/QuizViewScreen',
        params: {
          gameCode: gameCode,
          nickname: nickname,
        },
      });
    }
  }, [selectionComplete, gameStarted, gameCode, nickname, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4A6BF5', '#5F25FF']}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>
                {nickname ? String(nickname).charAt(0).toUpperCase() : 'P'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.username}>{nickname || 'Player'}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name='pencil' size={16} color='white' />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(95, 37, 255, 0.7)', 'rgba(95, 37, 255, 0.4)']}
            style={styles.menuButtonGradient}
          >
            <FontAwesome5 name='bars' size={18} color='white' />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Game info display */}
      <View style={styles.gameInfoContainer}>
        <Text style={styles.gameStatus}>
          Room: {gameCode} • Status: {gameInfo.status}
        </Text>
        <Text style={styles.categoryInfo}>{getCategoryInfo()}</Text>
        <Text style={styles.screenInfo}>{getCurrentScreenInfo()}</Text>
        <Text style={styles.connectionStatus}>
          {connected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
        <Text style={styles.selectionStatus}>
          Selection: {selectionComplete ? '✅ Complete' : '⏳ Waiting...'}
        </Text>
      </View>

      {/* Information about the last button pressed */}
      {lastPressed && (
        <View style={styles.lastPressedContainer}>
          <Text style={styles.lastPressedText}>
            Last command: <Text style={styles.commandText}>{lastPressed}</Text>
          </Text>
        </View>
      )}

      {/* Controller pad */}
      <View style={styles.controllerContainer}>
        {/* D-pad principal */}
        <View style={styles.dpadMainContainer}>
          {/* Base with border */}
          <View style={styles.dpadBaseOuter}>
            <View style={styles.dpadBaseInner}>
              {/* Crossed lines */}
              <View style={styles.crossLine1} />
              <View style={styles.crossLine2} />
              <View style={styles.crossLine3} />
              <View style={styles.crossLine4} />

              {/* Directional buttons */}
              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.upButton,
                  activeButton === 'up' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('up')}
              >
                <MaterialIcons
                  name='keyboard-arrow-up'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.rightButton,
                  activeButton === 'right' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('right')}
              >
                <MaterialIcons
                  name='keyboard-arrow-right'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.downButton,
                  activeButton === 'down' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('down')}
              >
                <MaterialIcons
                  name='keyboard-arrow-down'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.leftButton,
                  activeButton === 'left' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('left')}
              >
                <MaterialIcons
                  name='keyboard-arrow-left'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              {/* Botón central */}
              <TouchableOpacity
                style={[
                  styles.centerButton,
                  activeButton === 'enter' && styles.activeCenter,
                ]}
                activeOpacity={0.7}
                onPress={handleCenterPress}
              >
                <View style={styles.centerButtonInner}>
                  <Text style={styles.enterText}>OK</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom button bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='search' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='help-circle' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarButton}
          onPress={() => navigation.navigate('MenuScreen')}
        >
          <Ionicons name='grid' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='heart' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='volume-high' size={24} color='white' />
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 35,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  editButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuButtonGradient: {
    padding: 12,
    borderRadius: 20,
  },
  gameInfoContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  gameStatus: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryInfo: {
    color: '#dddddd',
    fontSize: 12,
    marginTop: 5,
  },
  screenInfo: {
    color: '#aaffaa',
    fontSize: 12,
    marginTop: 5,
  },
  connectionStatus: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  selectionStatus: {
    color: '#ffcc00',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  questionInfoContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    maxHeight: 150,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  optionsText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 22,
  },
  lastPressedContainer: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  lastPressedText: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  commandText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  controllerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // D-Pad corregido
  dpadMainContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadBaseOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#2A2A35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#3A3A45',
  },
  dpadBaseInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#333340',
    position: 'relative',
    overflow: 'hidden',
  },
  // Líneas cruzadas formando X
  crossLine1: {
    position: 'absolute',
    height: 8,
    width: '140%',
    top: '50%',
    left: '-20%',
    marginTop: -4,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#1A1A25',
  },
  crossLine2: {
    position: 'absolute',
    height: 8,
    width: '140%',
    top: '50%',
    left: '-20%',
    marginTop: -4,
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#1A1A25',
  },
  crossLine3: {
    position: 'absolute',
    height: 1,
    width: '140%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '-20%',
    marginTop: 1,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  crossLine4: {
    position: 'absolute',
    height: 1,
    width: '140%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '-20%',
    marginTop: 1,
    transform: [{ rotate: '-45deg' }],
    zIndex: 2,
  },
  // Botones direccionales
  dirButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    borderColor: '#4A4A5A',
  },
  upButton: {
    top: 10,
    left: '50%',
    marginLeft: -35,
  },
  rightButton: {
    top: '50%',
    right: 10,
    marginTop: -35,
  },
  downButton: {
    bottom: 10,
    left: '50%',
    marginLeft: -35,
  },
  leftButton: {
    top: '50%',
    left: 10,
    marginTop: -35,
  },
  activeButton: {
    backgroundColor: '#5F25FF',
    borderColor: '#7445FF',
  },
  // Botón central
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 90,
    height: 90,
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 45,
    backgroundColor: '#2C2C3C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#444455',
  },
  centerButtonInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#353545',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4A5A',
  },
  enterText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeCenter: {
    backgroundColor: '#5F25FF',
    borderColor: '#7445FF',
  },
  // Barra inferior
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20, 20, 30, 0.7)',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomBarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 50, 70, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
