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
  const { gameCode } = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [question, setQuestion] = useState({
    text: 'Waiting for the first question...',
    options: {
      A: '...',
      B: '...',
      C: '...',
      D: '...',
    },
  });
  const [answerResult, setAnswerResult] = useState<string | null>(null);
  const [questionEnded, setQuestionEnded] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const { socket, connected, error } = useSocketConnection(gameCode as string);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_question', (data) => {
      console.log('New question received:', data);
      setQuestion({
        text: data.question.question,
        options: data.options,
      });
      setTimeLeft(data.timeLimit);
      setSelectedOption(null);
      setAnswerResult(null);
      setQuestionEnded(false);
    });

    socket.on('timer_update', (timeRemaining) => {
      setTimeLeft(timeRemaining);
    });

    socket.on('question_ended', (data) => {
      console.log('Question ended:', data);
      setQuestionEnded(true);
      // If user didn't answer, show the correct answer
      if (selectedOption === null) {
        setAnswerResult('timeout');
        Vibration.vibrate(150);
      }
    });

    socket.on('answer_result', (data) => {
      console.log('Answer result:', data);
      setAnswerResult(data.correct ? 'correct' : 'incorrect');
      Vibration.vibrate(data.correct ? [0, 70, 50, 70] : 150);
    });

    socket.on('game_ended', (data) => {
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
    });

    return () => {
      socket.off('new_question');
      socket.off('timer_update');
      socket.off('question_ended');
      socket.off('answer_result');
      socket.off('game_ended');
    };
  }, [socket, router, selectedOption]);

  const handleOptionSelect = (option: string) => {
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

  if (!connected || error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? `Error: ${error}` : 'Connecting to server...'}
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
    <View style={styles.container}>
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
        answerResult={answerResult}
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
    elevation: 5,
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
