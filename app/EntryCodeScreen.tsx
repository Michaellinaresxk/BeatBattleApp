import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function EntryCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.length < 4) {
      Alert.alert('Error', 'The code must be at least 4 characters long');
      return;
    }

    const formattedCode = code.toUpperCase();
    console.log('Navigating to WaitingRoom with code:', formattedCode);

    router.push({
      pathname: '/WaitingRoomScreen',
      params: { gameCode: formattedCode },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        style={styles.background}
      />

      <Text style={styles.title}>GAME CODE</Text>

      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          placeholder='Ingresa el código'
          placeholderTextColor='#999'
          value={code}
          onChangeText={setCode}
          maxLength={6}
          autoCapitalize='characters'
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Unirse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 40,
    textAlign: 'center',
  },
  codeContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  codeInput: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    width: '100%',
    height: 60,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    backgroundColor: 'rgba(95, 37, 255, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#5F25FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
