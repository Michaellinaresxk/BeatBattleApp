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

  // Determinar si podemos mostrar los resultados - SOLO cuando questionEnded sea true
  const showResults = questionEnded;

  // Función para determinar el estilo de cada opción
  const getOptionStyle = (optionId: string) => {
    const baseStyle = styles.option;
    const isSelected = selectedOption === optionId;
    const isCorrect = correctAnswer === optionId;

    // Si esta opción está seleccionada
    if (isSelected) {
      // Si la pregunta NO ha terminado, solo mostrar como seleccionada
      if (!questionEnded) {
        return styles.selectedOption;
      }
      // Si la pregunta ha terminado, ahora podemos mostrar si era correcta o incorrecta
      else {
        if (optionId === correctAnswer) {
          return styles.correctOption;
        } else {
          return styles.incorrectOption;
        }
      }
    }

    // Si no está seleccionada pero es la correcta y podemos mostrar resultados
    if (isCorrect && showResults) {
      return styles.correctOption;
    }

    // Opciones no seleccionadas cuando se muestran resultados
    return showResults ? styles.disabledOption : styles.option;
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

  // Agregar log para depuración
  console.log('AnswerOptions rendering with:', {
    selectedOption,
    correctAnswer,
    questionEnded,
    showResults,
    timeLeft,
  });

  return (
    <View style={styles.optionsContainer}>
      {optionsArray.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={getOptionStyle(option.id)}
          onPress={() => onOptionSelect(option.id)}
          disabled={selectedOption !== null || questionEnded || timeLeft <= 0}
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
