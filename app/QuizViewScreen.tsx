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
  const [timeLeft, setTimeLeft] = useState(30);

  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);

  const [question, setQuestion] = useState({
    text: 'Waiting for the first question...',
    options: {
      A: '...',
      B: '...',
      C: '...',
      D: '...',
    },
  });
  const [answerResult, setAnswerResult] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [questionEnded, setQuestionEnded] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const { socket, connected, error } = useSocketConnection(gameCode);

  useEffect(() => {
    if (!gameCode) {
      console.error('No se encontró código de juego en QuizViewScreen');
      router.replace('/EntryCodeScreen');
    }
  }, [gameCode, router]);

  useEffect(() => {
    if (!socket) return;

    // Improved debugging of socket events
    socket.onAny((event, ...args) => {
      console.log(`[SOCKET EVENT] ${event}:`, JSON.stringify(args));
    });

    socket.on('new_question', (data) => {
      console.log('New question received:', JSON.stringify(data));

      // Safe handling of potentially missing data structure
      if (!data) {
        console.error('Received empty data in new_question event');
        return;
      }

      // Handle both array and object formats for options
      let formattedOptions = {};

      if (data.options) {
        if (Array.isArray(data.options)) {
          // Convert array format to object format for consistency in mobile
          formattedOptions = data.options.reduce((acc, option) => {
            if (option && option.id && option.text) {
              acc[option.id] = option.text;
            }
            return acc;
          }, {});
        } else if (typeof data.options === 'object') {
          formattedOptions = data.options;
        }
      }

      console.log('Formatted options:', formattedOptions);

      setQuestion({
        text: data.question?.question || 'No question text',
        options: formattedOptions || {},
      });

      if (data.question?.correctOptionId) {
        setCorrectAnswer(data.question.correctOptionId);
      }

      setTimeLeft(data.timeLimit || 30);
      setSelectedOption(null);
      setAnswerResult(null);
      setQuestionEnded(false);
    });

    socket.on('timer_update', (timeRemaining) => {
      setTimeLeft(timeRemaining);
    });

    socket.on('question_ended', (data) => {
      console.log('Question ended:', JSON.stringify(data));
      setQuestionEnded(true);

      // Update correct answer from the event data
      if (data && data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }

      // If user didn't answer, show the correct answer
      if (selectedOption === null) {
        setAnswerResult('timeout');
        Vibration.vibrate(150);
      }
    });

    socket.on('answer_result', (data) => {
      console.log('Answer result:', JSON.stringify(data));

      if (data.correct) {
        setAnswerResult('correct');
      } else {
        setAnswerResult('incorrect');
        // Store the correct answer for display
        if (data.correctAnswer) {
          setCorrectAnswer(data.correctAnswer);
        }
      }

      Vibration.vibrate(data.correct ? [0, 70, 50, 70] : 150);
    });

    socket.on('game_ended', (data) => {
      console.log('Game ended:', JSON.stringify(data));
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
    });

    return () => {
      socket.off('new_question');
      socket.off('timer_update');
      socket.off('question_ended');
      socket.off('answer_result');
      socket.off('game_ended');
    };
  }, [socket, router, selectedOption]);

  useEffect(() => {
    if (!socket) return;

    console.log('📱 Configurando listener para game_started en QuizViewScreen');

    const handleGameStarted = (data) => {
      console.log('🎮 Evento game_started recibido en QuizViewScreen:', data);

      // Establecer gameStarted a true
      setGameStarted(true);

      if (data.category) {
        setSelectedCategory(data.category);
      }

      if (data.categoryType) {
        setSelectedCategoryType(data.categoryType);
      }

      // Si hemos recibido el evento, estamos listos para jugar
      // Aquí no necesitamos navegar ya que estamos en la pantalla correcta
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [socket]);

  const handleOptionSelect = (option) => {
    console.log('Selecting option:', option);
    if (selectedOption === null && !questionEnded && timeLeft > 0) {
      setSelectedOption(option);
      Vibration.vibrate(30);

      if (socket) {
        socket.emit('submit_answer', {
          roomCode: gameCode,
          answer: option,
        });
      }
    }
  };

  const handleNextQuestion = () => {
    if (socket) {
      socket.emit('request_next_question', { roomCode: gameCode });
      setSelectedOption(null);
      setAnswerResult(null);
      setQuestionEnded(false);
    }
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

      <QuestionDisplay question={question.text} />

      <AnswerOptions
        options={question.options}
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
});
