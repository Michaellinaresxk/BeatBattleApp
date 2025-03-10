import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnswerOptionsProps {
  options: Record<string, string>;
  selectedOption: string | null;
  correctAnswer: string | null;
  onOptionSelect: (option: string) => void;
  questionEnded: boolean;
  timeLeft: number;
}

export function AnswerOptions({
  options,
  selectedOption,
  correctAnswer,
  onOptionSelect,
  questionEnded,
  timeLeft,
}: AnswerOptionsProps) {
  // Convertir opciones a array para facilitar el mapeo
  const optionsArray = Object.entries(options).map(([id, text]) => ({
    id,
    text,
  }));

  // Determinar si podemos mostrar los resultados
  const showResults =
    questionEnded ||
    (selectedOption !== null && correctAnswer !== null) ||
    timeLeft === 0;

  // Función para determinar el estilo de cada opción
  const getOptionStyle = (optionId: string) => {
    const isSelected = selectedOption === optionId;
    const isCorrect = correctAnswer === optionId;

    if (!showResults) {
      return isSelected ? styles.selectedOption : styles.option;
    }

    if (isCorrect) {
      return styles.correctOption;
    }

    if (isSelected && !isCorrect) {
      return styles.incorrectOption;
    }

    return styles.disabledOption;
  };

  // Función para determinar el icono de cada opción
  const getOptionIcon = (optionId: string) => {
    const isSelected = selectedOption === optionId;
    const isCorrect = correctAnswer === optionId;

    if (!showResults) {
      return null;
    }

    if (isCorrect) {
      return (
        <Ionicons
          name='checkmark-circle'
          size={24}
          color='#4CAF50'
          style={styles.optionIcon}
        />
      );
    }

    if (isSelected && !isCorrect) {
      return (
        <Ionicons
          name='close-circle'
          size={24}
          color='#F44336'
          style={styles.optionIcon}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.optionsContainer}>
      {optionsArray.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={getOptionStyle(option.id)}
          onPress={() => onOptionSelect(option.id)}
          disabled={showResults || timeLeft === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>{option.text}</Text>
          {getOptionIcon(option.id)}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  option: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: 'rgba(95, 37, 255, 0.3)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(95, 37, 255, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledOption: {
    backgroundColor: 'rgba(40, 40, 60, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.7,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  optionIcon: {
    marginLeft: 10,
  },
});
