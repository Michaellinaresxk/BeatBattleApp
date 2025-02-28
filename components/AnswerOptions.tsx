import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Option {
  id: string;
  text: string;
}

interface AnswerOptionsProps {
  options: Option[] | Record<string, Option>;
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
  // Convert options to array if it's an object
  const optionsArray = Array.isArray(options)
    ? options
    : Object.entries(options).map(([id, option]) => {
        // If option is an object with text property, use it
        if (typeof option === 'object' && option.text) {
          return option;
        }
        // Otherwise, create an option object
        return { id, text: String(option) };
      });

  return (
    <View style={styles.optionsContainer}>
      {optionsArray.map((option) => {
        const isSelected = selectedOption === option.id;
        const isDisabled =
          selectedOption !== null || questionEnded || timeLeft <= 0;

        let backgroundColor = 'rgba(40, 40, 60, 0.4)';
        let borderColor = 'rgba(255, 255, 255, 0.1)';

        if (isSelected) {
          if (answerResult === 'correct') {
            backgroundColor = 'rgba(76, 175, 80, 0.3)';
            borderColor = '#4CAF50';
          } else if (answerResult === 'incorrect') {
            backgroundColor = 'rgba(244, 67, 54, 0.3)';
            borderColor = '#F44336';
          } else {
            backgroundColor = 'rgba(95, 37, 255, 0.3)';
            borderColor = '#5F25FF';
          }
        }

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              { backgroundColor, borderColor },
              isDisabled && styles.optionDisabled,
            ]}
            onPress={() => onOptionSelect(option.id)}
            disabled={isDisabled}
          >
            <LinearGradient
              colors={
                isSelected
                  ? ['rgba(95, 37, 255, 0.2)', 'rgba(74, 107, 245, 0.2)']
                  : ['transparent', 'transparent']
              }
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>{option.id}</Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    padding: 10,
    marginTop: 10,
  },
  optionButton: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 15,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  optionDisabled: {
    opacity: 0.7,
  },
});
