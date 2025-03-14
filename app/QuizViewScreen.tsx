'use client';

import { useState, useEffect, SetStateAction } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
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
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  const {
    socket,
    connected,
    error,
    currentQuestion,
    timeLeft,
    questionEnded,
    correctAnswer,
    setCorrectAnswer,
    answerSubmitted,
    setQuestionEnded,
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

  // Manejo inicial cuando se monta el componente
  useEffect(() => {
    if (connected && socket) {
      console.log('QuizViewScreen mounted, connection ready');
      setLoading(false);
      // No solicitamos automáticamente la pregunta - esperaremos a que el usuario presione Start
    }
  }, [connected, socket]);

  // Update loading state when question is received
  useEffect(() => {
    if (currentQuestion) {
      setLoading(false);
      // Si tenemos una pregunta, asumimos que el quiz ha comenzado
      setQuizStarted(true);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (!socket) return;

    const handleAnswerResult = (data) => {
      console.log('Answer result received:', data);

      // Marcar que este jugador ha respondido
      setHasAnswered(true);

      // Mostrar feedback local sobre si la respuesta fue correcta/incorrecta
      if (data.correct) {
        setAnswerResult('correct');
        Vibration.vibrate([0, 70, 50, 70]);

        // Actualizar puntuación
        if (data.score !== undefined) {
          setScore(data.score);
        } else {
          setScore((prevScore) => prevScore + 1);
        }

        setTotalCorrect((prev) => prev + 1);
      } else {
        setAnswerResult('incorrect');
        Vibration.vibrate(150);
        setTotalWrong((prev) => prev + 1);
      }

      // IMPORTANTE: NO establecer questionEnded aquí
      // Sólo registramos que este usuario ha respondido
    };

    const handleQuestionEnded = (data) => {
      console.log('Question ended event received:', data);

      // AHORA SÍ marcamos la pregunta como terminada para todos
      setQuestionEnded(true);

      // Establecer la respuesta correcta
      if (data && data.correctAnswer) {
        console.log(`Setting correct answer: ${data.correctAnswer}`);
        setCorrectAnswer(data.correctAnswer);
      }
    };

    socket.on('answer_result', handleAnswerResult);
    socket.on('question_ended', handleQuestionEnded);

    return () => {
      socket.off('answer_result', handleAnswerResult);
      socket.off('question_ended', handleQuestionEnded);
    };
  }, [socket, setQuestionEnded, setCorrectAnswer]);

  // Reset the hasAnswered state when a new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setAnswerResult(null);
      setHasAnswered(false);
      setQuestionEnded(false); // Asegurarnos de que questionEnded es false
    }
  }, [currentQuestion, setQuestionEnded]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && !selectedOption) {
      setAnswerResult('timeout');
    }
  }, [timeLeft, selectedOption]);

  // Monitorear cambios en el temporizador para depuración
  useEffect(() => {
    console.log(`⏱️ [QuizViewScreen] timeLeft changed: ${timeLeft}s`);
  }, [timeLeft]);

  const handleStartQuiz = () => {
    console.log('Starting quiz, requesting first question');
    setQuizStarted(true);
    // Reiniciar la puntuación al comenzar un nuevo quiz
    setScore(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    requestCurrentQuestion();
  };

  const handleOptionSelect = (option) => {
    console.log('Selecting option:', option);

    // Solo permitir seleccionar si no ha respondido y la pregunta aún está activa
    if (!hasAnswered && !questionEnded && timeLeft > 0) {
      setSelectedOption(option);
      submitAnswer(option);

      // Establecer estado de espera para feedback visual
      setAnswerResult('waiting');
    }
  };

  const handleNextQuestion = () => {
    requestNextQuestion();
    setSelectedOption(null);
    setAnswerResult(null);
    setLoading(true); // Mostrar pantalla de carga mientras se carga la siguiente pregunta
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
            Your final score: {score} points
          </Text>
          <Text style={styles.gameEndedSubtext}>
            Correct answers: {totalCorrect}/{totalCorrect + totalWrong}
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

  // Pantalla de inicio del quiz con botón Start
  if (!quizStarted && connected) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        <View style={styles.startContainer}>
          <Text style={styles.startTitle}>Ready to start?</Text>
          <Text style={styles.startSubtitle}>
            Press the button when you're ready to begin the quiz
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartQuiz}
          >
            <LinearGradient
              colors={['#5F25FF', '#4A6BF5']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

      {/* Mostrar puntuación de forma simple */}
      <View style={styles.scoreDisplay}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      <View style={styles.timerProgressContainer}>
        <View
          style={[
            styles.timerProgressBar,
            {
              width: `${(timeLeft / (currentQuestion.timeLimit || 30)) * 100}%`,
              backgroundColor: timeLeft < 10 ? '#FF5353' : '#5F25FF',
            },
          ]}
        />
      </View>

      <QuestionDisplay question={questionText} />

      <AnswerOptions
        options={options}
        selectedOption={selectedOption}
        correctAnswer={correctAnswer}
        onOptionSelect={handleOptionSelect}
        questionEnded={questionEnded} // Pasar el estado de questionEnded
        timeLeft={timeLeft}
      />

      {selectedOption && (
        <View style={styles.statusContainer}>
          {answerResult === null ? (
            <Text style={styles.waitingText}>Waiting for result...</Text>
          ) : answerResult === 'waiting' ? (
            <Text style={styles.waitingText}>Checking answer...</Text>
          ) : answerResult === 'correct' ? (
            <Text style={styles.correctText}>Correct Answer!</Text>
          ) : answerResult === 'timeout' ? (
            <Text style={styles.timeoutText}>Time's up!</Text>
          ) : (
            <Text style={styles.incorrectText}>Incorrect Answer</Text>
          )}
        </View>
      )}

      {questionEnded && (
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

  scoreDisplay: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(95, 37, 255, 0.3)',
    borderRadius: 8,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
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
  // Estilos para la pantalla de inicio del quiz
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  startSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  startButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  timerProgressContainer: {
    height: 8,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 4,
    marginHorizontal: 20,
    marginBottom: 10,
    overflow: 'hidden',
  },
  timerProgressBar: {
    height: '100%',
    borderRadius: 4,
    width: '100%',
  },
});
