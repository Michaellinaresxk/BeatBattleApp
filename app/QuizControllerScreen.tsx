'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { AnswerOptions } from '@/components/AnswerOptions';

const { width } = Dimensions.get('window');

export default function QuizControllerScreen() {
  const { gameCode } = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [question, setQuestion] = useState({
    text: '¿Cuál es la capital de Francia?',
    options: {
      A: 'Londres',
      B: 'Madrid',
      C: 'París',
      D: 'Berlín',
    },
  });
  const [answerResult, setAnswerResult] = useState(null);
  const [questionEnded, setQuestionEnded] = useState(false);

  const socket = useSocketConnection(gameCode as string);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_question', (data) => {
      console.log('Nueva pregunta recibida:', data);
      setQuestion(data.question);
      setTimeLeft(data.timeLimit);
      setSelectedOption(null);
      setAnswerResult(null);
      setQuestionEnded(false);
    });

    socket.on('timer_update', (data) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('question_ended', (data) => {
      console.log('Pregunta terminada:', data);
      setQuestionEnded(true);
    });

    socket.on('answer_result', (data) => {
      console.log('Resultado de respuesta:', data);
      setAnswerResult(data.correct ? 'correct' : 'incorrect');
      Vibration.vibrate(data.correct ? [0, 70, 50, 70] : 150);
    });

    return () => {
      socket.off('new_question');
      socket.off('timer_update');
      socket.off('question_ended');
      socket.off('answer_result');
    };
  }, [socket]);

  const handleOptionSelect = (option) => {
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
          <Text style={styles.roomCodeLabel}>SALA</Text>
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
            <Text style={styles.waitingText}>Esperando resultado...</Text>
          ) : answerResult === 'correct' ? (
            <Text style={styles.correctText}>¡Respuesta Correcta!</Text>
          ) : (
            <Text style={styles.incorrectText}>Respuesta Incorrecta</Text>
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
            <Text style={styles.nextButtonText}>Siguiente Pregunta</Text>
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
  questionContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionPrefix: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 5,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
    padding: 10,
  },
  optionButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#5F25FF',
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  correctOption: {
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  incorrectOption: {
    borderColor: '#F44336',
    shadowColor: '#F44336',
  },
  optionGradient: {
    padding: 15,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    width: 30,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
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
});
