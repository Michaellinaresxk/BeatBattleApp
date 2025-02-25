'use client';

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ControllerScreen({ navigation }) {
  const [lastPressed, setLastPressed] = useState('');

  // Manejar pulsaciones de botones direccionales
  const handleDirectionPress = (direction) => {
    setLastPressed(direction);
    console.log(`Presionado: ${direction}`);
    // Aquí puedes enviar comandos a tu juego
  };

  // Manejar pulsación del botón central
  const handleCenterPress = () => {
    setLastPressed('enter');
    console.log('Presionado: Enter');
    // Aquí puedes enviar el comando "enter" a tu juego
  };

  // Abrir menú
  const openMenu = () => {
    navigation && navigation.navigate('MenuScreen');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4A6BF5', '#5F25FF']}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>M</Text>
            </LinearGradient>
          </View>
          <Text style={styles.username}>Michael</Text>
          <TouchableOpacity onPress={() => {}} style={styles.editButton}>
            <Ionicons name='pencil' size={16} color='white' />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(95, 37, 255, 0.7)', 'rgba(95, 37, 255, 0.4)']}
            style={styles.menuButtonGradient}
          >
            <FontAwesome5 name='bars' size={18} color='white' />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Información sobre último botón pulsado */}
      {lastPressed && (
        <View style={styles.lastPressedContainer}>
          <Text style={styles.lastPressedText}>
            Último comando:{' '}
            <Text style={styles.commandText}>{lastPressed}</Text>
          </Text>
        </View>
      )}

      {/* Controlador direccional */}
      <View style={styles.controllerContainer}>
        <View style={styles.dpadContainer}>
          {/* Botón Superior */}
          <Pressable
            onPress={() => handleDirectionPress('up')}
            style={({ pressed }) => [
              styles.dpadButton,
              styles.dpadUp,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#414151', '#2A2A36']}
              style={styles.dpadButtonGradient}
            >
              <Ionicons name='chevron-up' size={32} color='white' />
            </LinearGradient>
          </Pressable>

          {/* Botón Izquierdo */}
          <Pressable
            onPress={() => handleDirectionPress('left')}
            style={({ pressed }) => [
              styles.dpadButton,
              styles.dpadLeft,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#414151', '#2A2A36']}
              style={styles.dpadButtonGradient}
            >
              <Ionicons name='chevron-back' size={32} color='white' />
            </LinearGradient>
          </Pressable>

          {/* Botón Central */}
          <Pressable
            onPress={handleCenterPress}
            style={({ pressed }) => [
              styles.dpadButton,
              styles.dpadCenter,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#4A6BF5', '#2541B2']}
              style={styles.dpadButtonGradient}
            >
              <FontAwesome5 name='arrow-right' size={24} color='white' />
            </LinearGradient>
          </Pressable>

          {/* Botón Derecho */}
          <Pressable
            onPress={() => handleDirectionPress('right')}
            style={({ pressed }) => [
              styles.dpadButton,
              styles.dpadRight,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#414151', '#2A2A36']}
              style={styles.dpadButtonGradient}
            >
              <Ionicons name='chevron-forward' size={32} color='white' />
            </LinearGradient>
          </Pressable>

          {/* Botón Inferior */}
          <Pressable
            onPress={() => handleDirectionPress('down')}
            style={({ pressed }) => [
              styles.dpadButton,
              styles.dpadDown,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#414151', '#2A2A36']}
              style={styles.dpadButtonGradient}
            >
              <Ionicons name='chevron-down' size={32} color='white' />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Barra de botones inferiores */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='search' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='help-circle' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='grid' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='heart' size={24} color='white' />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarButton}>
          <Ionicons name='volume-high' size={24} color='white' />
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 35,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  editButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuButtonGradient: {
    padding: 12,
    borderRadius: 20,
  },
  lastPressedContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(40, 40, 60, 0.4)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  lastPressedText: {
    color: '#aaaaaa',
    fontSize: 16,
  },
  commandText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  controllerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadContainer: {
    width: 230,
    height: 230,
    position: 'relative',
  },
  dpadButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dpadButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadUp: {
    top: 0,
    left: 75,
  },
  dpadLeft: {
    top: 75,
    left: 0,
  },
  dpadCenter: {
    top: 75,
    left: 75,
  },
  dpadRight: {
    top: 75,
    left: 150,
  },
  dpadDown: {
    top: 150,
    left: 75,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20, 20, 30, 0.7)',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomBarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 50, 70, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
