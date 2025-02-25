'use client';

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

// Tipo para la navegación
type RootStackParamList = {
  EntryCodeScreen: undefined;
  WaitingRoomScreen: { gameCode: string };
  // Otras pantallas aquí
};

type EntryCodeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EntryCodeScreen'
>;

const buttons = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['Clear', '0', 'Enter'],
];

export default function EntryCodeScreen() {
  const navigation = useNavigation<EntryCodeNavigationProp>();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(''); // 'success', 'error', o ''

  const handlePress = (value) => {
    if (value === 'Clear') {
      setCode('');
      setStatus('');
    } else if (value === 'Enter') {
      if (code.length < 4) {
        setStatus('error');
        // Limpiar error después de 2 segundos
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('success');
        console.log('Submitted code:', code);

        // Navegar a la sala de espera después de breve indicación de éxito
        setTimeout(() => {
          // Navegar a WaitingRoomScreen con el código como parámetro
          navigation.navigate('WaitingRoomScreen', { gameCode: code });
        }, 500);
      }
    } else if (code.length < 6) {
      setCode((prevCode) => prevCode + value);
      setStatus('');
    }
  };

  // Genera los dígitos para mostrar
  const displayDigits = [];
  for (let i = 0; i < 6; i++) {
    displayDigits.push(
      <View key={i} style={[styles.digit, code[i] ? styles.filledDigit : null]}>
        {code[i] ? (
          <Text style={styles.digitText}>{code[i]}</Text>
        ) : (
          <View style={styles.emptyDigitDot} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fondo con degradado moderno */}
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Elementos decorativos - círculos con degradado */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.contentContainer}>
        {/* Título con estilo moderno */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>GAME CODE</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Contenedor del código con efecto de vidrio */}
        <View
          style={[
            styles.codeContainer,
            status === 'error' && styles.errorContainer,
            status === 'success' && styles.successContainer,
          ]}
        >
          <View style={styles.digitsRow}>{displayDigits}</View>

          {status === 'error' && (
            <Text style={styles.errorText}>
              Código muy corto (mín. 4 dígitos)
            </Text>
          )}

          {status === 'success' && (
            <Text style={styles.successText}>¡Código aceptado!</Text>
          )}
        </View>

        {/* Teclado numérico moderno */}
        <View style={styles.buttonContainer}>
          {buttons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((button) => (
                <TouchableOpacity
                  key={button}
                  style={[
                    styles.button,
                    button === 'Enter' && styles.enterButton,
                    button === 'Clear' && styles.clearButton,
                  ]}
                  onPress={() => handlePress(button)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      button === 'Enter'
                        ? ['#4A6BF5', '#2541B2']
                        : button === 'Clear'
                        ? ['#F55353', '#B22525']
                        : ['#414151', '#2A2A36']
                    }
                    style={styles.buttonGradient}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        (button === 'Enter' || button === 'Clear') &&
                          styles.specialButtonText,
                      ]}
                    >
                      {button}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Texto informativo con ícono */}
        <View style={styles.helperContainer}>
          <View style={styles.helperIcon} />
          <Text style={styles.helperText}>
            Ingresa el código de tu invitación al juego
          </Text>
        </View>
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
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(95, 37, 255, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 255, 0.1)',
  },
  contentContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 10,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#5F25FF',
    borderRadius: 1.5,
  },
  codeContainer: {
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  errorContainer: {
    borderColor: 'rgba(255, 83, 83, 0.7)',
  },
  successContainer: {
    borderColor: 'rgba(83, 255, 136, 0.7)',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  digit: {
    width: 45,
    height: 60,
    backgroundColor: 'rgba(30, 30, 45, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filledDigit: {
    backgroundColor: 'rgba(95, 37, 255, 0.25)',
    borderColor: 'rgba(95, 37, 255, 0.5)',
  },
  digitText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(95, 37, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  emptyDigitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  errorText: {
    color: '#FF5353',
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#53FF88',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 360,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  button: {
    flex: 1,
    margin: 6,
    height: 65,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  enterButton: {
    shadowColor: '#4A6BF5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  clearButton: {
    shadowColor: '#F55353',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  specialButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helperIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(95, 37, 255, 0.6)',
    marginRight: 10,
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
