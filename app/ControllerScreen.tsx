'use client';

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ControllerScreen() {
  const router = useRouter();
  const [lastPressed, setLastPressed] = useState('');
  const [activeButton, setActiveButton] = useState(null);

  // Manejar pulsaciones de botones direccionales con feedback
  const handleDirectionPress = (direction) => {
    setLastPressed(direction);
    setActiveButton(direction);
    Vibration.vibrate(30);
    console.log(`Presionado: ${direction}`);

    // Resetear después de un tiempo
    setTimeout(() => {
      setActiveButton(null);
    }, 200);
  };

  // Manejar pulsación del botón central
  const handleCenterPress = () => {
    setLastPressed('enter');
    setActiveButton('enter');
    Vibration.vibrate(50);
    console.log('Presionado: Enter');

    // Resetear después de un tiempo
    setTimeout(() => {
      setActiveButton(null);
    }, 200);
  };

  // Abrir menú
  const openMenu = () => {
    router.push('/MenuScreen');
  };

  const openOptionScreen = () => {
    router.push('/MenuScreen');
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

      {/* Controlador direccional - Diseño 3D corregido */}
      <View style={styles.controllerContainer}>
        {/* D-pad principal */}
        <View style={styles.dpadMainContainer}>
          {/* Base con borde */}
          <View style={styles.dpadBaseOuter}>
            <View style={styles.dpadBaseInner}>
              {/* Líneas cruzadas */}
              <View style={styles.crossLine1} />
              <View style={styles.crossLine2} />
              <View style={styles.crossLine3} />
              <View style={styles.crossLine4} />

              {/* Botones direccionales */}
              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.upButton,
                  activeButton === 'up' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('up')}
              >
                <MaterialIcons
                  name='keyboard-arrow-up'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.rightButton,
                  activeButton === 'right' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('right')}
              >
                <MaterialIcons
                  name='keyboard-arrow-right'
                  size={32}
                  color='white'
                  xx
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.downButton,
                  activeButton === 'down' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('down')}
              >
                <MaterialIcons
                  name='keyboard-arrow-down'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dirButton,
                  styles.leftButton,
                  activeButton === 'left' && styles.activeButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleDirectionPress('left')}
              >
                <MaterialIcons
                  name='keyboard-arrow-left'
                  size={32}
                  color='white'
                />
              </TouchableOpacity>

              {/* Botón central */}
              <TouchableOpacity
                style={[
                  styles.centerButton,
                  activeButton === 'enter' && styles.activeCenter,
                ]}
                activeOpacity={0.7}
                onPress={handleCenterPress}
              >
                <View style={styles.centerButtonInner}>
                  <Text style={styles.enterText}>OK</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
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

        <TouchableOpacity
          style={styles.bottomBarButton}
          onPress={openOptionScreen}
        >
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

  // D-Pad corregido
  dpadMainContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadBaseOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#2A2A35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#3A3A45',
  },
  dpadBaseInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#333340',
    position: 'relative',
    overflow: 'hidden',
  },
  // Líneas cruzadas formando X
  crossLine1: {
    position: 'absolute',
    height: 8,
    width: '140%',
    top: '50%',
    left: '-20%',
    marginTop: -4,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#1A1A25',
  },
  crossLine2: {
    position: 'absolute',
    height: 8,
    width: '140%',
    top: '50%',
    left: '-20%',
    marginTop: -4,
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#1A1A25',
  },
  crossLine3: {
    position: 'absolute',
    height: 1,
    width: '140%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '-20%',
    marginTop: 1,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  crossLine4: {
    position: 'absolute',
    height: 1,
    width: '140%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '-20%',
    marginTop: 1,
    transform: [{ rotate: '-45deg' }],
    zIndex: 2,
  },
  // Botones direccionales
  dirButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    borderColor: '#4A4A5A',
  },
  upButton: {
    top: 10,
    left: '50%',
    marginLeft: -35,
  },
  rightButton: {
    top: '50%',
    right: 10,
    marginTop: -35,
  },
  downButton: {
    bottom: 10,
    left: '50%',
    marginLeft: -35,
  },
  leftButton: {
    top: '50%',
    left: 10,
    marginTop: -35,
  },
  activeButton: {
    backgroundColor: '#5F25FF',
    borderColor: '#7445FF',
  },
  // Botón central
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 90,
    height: 90,
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 45,
    backgroundColor: '#2C2C3C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#444455',
  },
  centerButtonInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#353545',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4A5A',
  },
  enterText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeCenter: {
    backgroundColor: '#5F25FF',
    borderColor: '#7445FF',
  },
  // Barra inferior
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
