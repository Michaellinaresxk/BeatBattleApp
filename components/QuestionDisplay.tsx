import { View, Text, StyleSheet } from 'react-native';

interface QuestionDisplayProps {
  question: string;
}

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionPrefix}>Pregunta:</Text>
      <Text style={styles.questionText}>
        {question || 'Esperando pregunta...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
