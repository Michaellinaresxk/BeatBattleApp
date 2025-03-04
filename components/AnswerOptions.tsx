import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AnswerOptionsProps {
  options: any; // Support both array and object formats
  selectedOption: string | null;
  answerResult: string | null;
  onOptionSelect: (id: string) => void;
  questionEnded: boolean;
  timeLeft: number;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  selectedOption,
  answerResult,
  onOptionSelect,
  questionEnded,
  timeLeft,
}) => {
  // Debugging
  console.log('Rendering options:', options);
  console.log('Options type:', typeof options);
  console.log('Is array:', Array.isArray(options));

  // Handle both array and object formats
  const renderOptions = () => {
    // If options is an array (web app format)
    if (Array.isArray(options)) {
      return options.map((option, index) => (
        <TouchableOpacity
          key={option.id || `option-${index}`}
          style={[
            styles.optionButton,
            selectedOption === option.id && styles.optionSelected,
            questionEnded && answerResult === option.id && styles.optionCorrect,
            questionEnded &&
              selectedOption === option.id &&
              selectedOption !== answerResult &&
              styles.optionIncorrect,
          ]}
          onPress={() => handleSelectOption(option.id)}
          disabled={questionEnded || timeLeft <= 0 || selectedOption !== null}
        >
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      ));
    }
    // If options is an object (mobile app format)
    else if (options && typeof options === 'object') {
      return Object.entries(options).map(([key, value], index) => (
        <TouchableOpacity
          key={key || `option-${index}`}
          style={[
            styles.optionButton,
            selectedOption === key && styles.optionSelected,
            questionEnded && answerResult === key && styles.optionCorrect,
            questionEnded &&
              selectedOption === key &&
              selectedOption !== answerResult &&
              styles.optionIncorrect,
          ]}
          onPress={() => handleSelectOption(key)}
          disabled={questionEnded || timeLeft <= 0 || selectedOption !== null}
        >
          <Text style={styles.optionText}>{String(value)}</Text>
        </TouchableOpacity>
      ));
    }
    // Fallback if options is undefined or has unexpected format
    else {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No options available or invalid format
          </Text>
        </View>
      );
    }
  };

  const handleSelectOption = (optionId: string) => {
    console.log('Option selected:', optionId);
    if (!selectedOption && !questionEnded && timeLeft > 0) {
      onOptionSelect(optionId);
    }
  };

  return <View style={styles.container}>{renderOptions()}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
  },
  optionButton: {
    backgroundColor: 'rgba(60, 60, 100, 0.6)',
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionSelected: {
    backgroundColor: 'rgba(74, 107, 245, 0.8)',
    borderColor: '#5F25FF',
  },
  optionCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderColor: '#F44336',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF9800',
    fontSize: 16,
  },
});
