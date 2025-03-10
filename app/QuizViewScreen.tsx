'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { AnswerOptions } from '@/components/AnswerOptions';

const { width } = Dimensions.get('window');

export default function QuizViewScreen() {
  const router = useRouter();
  const { gameCode, nickname } = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    socket,
    connected,
    error,
    currentQuestion,
    timeLeft,
    questionEnded,
    correctAnswer,
    submitAnswer,
    requestCurrentQuestion,
    requestNextQuestion,
  } = useSocketConnection(gameCode, nickname);

  useEffect(() => {
    if (!gameCode) {
      console.error('No se encontró código de juego en QuizViewScreen');
      router.replace('/EntryCodeScreen');
    }
  }, [gameCode, router]);

  // Request current question when component mounts
  useEffect(() => {
    if (connected && socket) {
      console.log('QuizViewScreen mounted, requesting current question');
      requestCurrentQuestion();

      // Set a timeout to check if we received a question
      const timer = setTimeout(() => {
        if (!currentQuestion) {
          console.log('No question received after timeout, requesting again');
          requestCurrentQuestion();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [connected, socket, requestCurrentQuestion, currentQuestion]);

  // Update loading state when question is received
  useEffect(() => {
    if (currentQuestion) {
      setLoading(false);
    }
  }, [currentQuestion]);

  // Listen for answer results
  useEffect(() => {
    if (!socket) return;

    const handleAnswerResult = (data) => {
      console.log('Answer result received:', data);
      if (data.correct) {
        setAnswerResult('correct');
      } else {
        setAnswerResult('incorrect');
      }
      Vibration.vibrate(data.correct ? [0, 70, 50, 70] : 150);
    };

    const handleGameEnded = (data) => {
      console.log('Game ended:', data);
      setGameEnded(true);
      Alert.alert(
        'Game Over',
        'The quiz has ended. Check the main screen for results!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/EntryCodeScreen'),
          },
        ]
      );
    };

    socket.on('answer_result', handleAnswerResult);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('answer_result', handleAnswerResult);
      socket.off('game_ended', handleGameEnded);
    };
  }, [socket, router]);

  // Reset selected option when new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setAnswerResult(null);
    }
  }, [currentQuestion]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && !selectedOption) {
      setAnswerResult('timeout');
      Vibration.vibrate(150);
    }
  }, [timeLeft, selectedOption]);

  const handleOptionSelect = (option) => {
    console.log('Selecting option:', option);
    if (selectedOption === null && !questionEnded && timeLeft > 0) {
      setSelectedOption(option);
      Vibration.vibrate(30);
      submitAnswer(option);
    }
  };

  const handleNextQuestion = () => {
    requestNextQuestion();
    setSelectedOption(null);
    setAnswerResult(null);
  };

  const handleRetry = () => {
    console.log('Retrying connection and requesting question');
    requestCurrentQuestion();
  };

  if (gameEnded) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.gameEndedContainer}>
          <Text style={styles.gameEndedText}>Game Over!</Text>
          <Text style={styles.gameEndedSubtext}>
            Check the main screen for results
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/EntryCodeScreen')}
          >
            <Text style={styles.backButtonText}>Back to Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If no question is available yet, show loading state
  if (loading || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Waiting for question...</Text>
          {!connected && (
            <Text style={styles.errorText}>
              Not connected to server. Please wait...
            </Text>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>
              Connected: {connected ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>Room Code: {gameCode}</Text>
            <Text style={styles.debugText}>Nickname: {nickname}</Text>
            <Text style={styles.debugText}>
              Has Socket: {socket ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>Error: {error || 'None'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Extract question data safely
  const questionText =
    currentQuestion.question?.question ||
    currentQuestion.text ||
    'No question text';
  const options = currentQuestion.options || {};

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View style={styles.header}>
        <View style={styles.roomInfoContainer}>
          <Text style={styles.roomCodeLabel}>ROOM</Text>
          <Text style={styles.roomCode}>{gameCode}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timer, timeLeft < 10 && styles.timerWarning]}>
            {timeLeft}
          </Text>
        </View>
      </View>

      <QuestionDisplay question={questionText} />

      <AnswerOptions
        options={options}
        selectedOption={selectedOption}
        answerResult={correctAnswer}
        onOptionSelect={handleOptionSelect}
        questionEnded={questionEnded}
        timeLeft={timeLeft}
      />

      {selectedOption && (
        <View style={styles.statusContainer}>
          {answerResult === null ? (
            <Text style={styles.waitingText}>Waiting for result...</Text>
          ) : answerResult === 'correct' ? (
            <Text style={styles.correctText}>Correct Answer!</Text>
          ) : answerResult === 'timeout' ? (
            <Text style={styles.timeoutText}>Time's up!</Text>
          ) : (
            <Text style={styles.incorrectText}>Incorrect Answer</Text>
          )}
        </View>
      )}

      {(questionEnded || answerResult !== null) && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextQuestion}
        >
          <LinearGradient
            colors={['#5F25FF', '#4A6BF5']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>Next Question</Text>
            <Ionicons name='arrow-forward' size={20} color='white' />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  roomInfoContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    padding: 10,
  },
  roomCodeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  roomCode: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(95, 37, 255, 0.5)',
  },
  timer: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerWarning: {
    color: '#FF5353',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  waitingText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  incorrectText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeoutText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(95, 37, 255, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameEndedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameEndedText: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gameEndedSubtext: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(95, 37, 255, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    width: '90%',
  },
  debugText: {
    color: '#aaaaaa',
    fontSize: 12,
    marginBottom: 5,
  },
});
