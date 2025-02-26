import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnswerOptionsProps {
  options: { [key: string]: string };
  selectedOption: string | null;
  answerResult: string | null;
  onOptionSelect: (option: string) => void;
  questionEnded: boolean;
  timeLeft: number;
}

export function AnswerOptions({
  options,
  selectedOption,
  answerResult,
  onOptionSelect,
  questionEnded,
  timeLeft,
}: AnswerOptionsProps) {
  const getOptionColors = (option: string) => {
    if (selectedOption === option) {
      if (answerResult === 'correct') {
        return ['#4CAF50', '#2E7D32'];
      } else if (answerResult === 'incorrect') {
        return ['#F44336', '#C62828'];
      } else {
        return ['#5F25FF', '#4A6BF5'];
      }
    }
    return ['rgba(40, 40, 60, 0.8)', 'rgba(30, 30, 45, 0.6)'];
  };

  return (
    <View style={styles.optionsContainer}>
      {Object.entries(options).map(([key, value]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.optionButton,
            selectedOption === key && styles.selectedOption,
            answerResult === 'correct' &&
              selectedOption === key &&
              styles.correctOption,
            answerResult === 'incorrect' &&
              selectedOption === key &&
              styles.incorrectOption,
          ]}
          onPress={() => onOptionSelect(key)}
          disabled={selectedOption !== null || questionEnded || timeLeft === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getOptionColors(key)}
            style={styles.optionGradient}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLetter}>{key}</Text>
              <Text style={styles.optionText}>{value}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
