'use client';

import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  EntryCodeScreen: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

// Partículas flotantes para efecto de ambiente de videojuego
const Particle = ({ index }: { index: number }) => {
  const size = 4 + Math.random() * 6;
  const initialX = Math.random() * width;
  const initialY = Math.random() * height;

  const translateY = useSharedValue(initialY);
  const translateX = useSharedValue(initialX);
  const opacity = useSharedValue(0.3 + Math.random() * 0.4);

  useEffect(() => {
    const duration = 5000 + Math.random() * 10000;

    translateY.value = withRepeat(
      withTiming(initialY - 100 - Math.random() * 200, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      true
    );

    translateX.value = withRepeat(
      withTiming(initialX + 20 - Math.random() * 40, {
        duration: duration * 1.2,
        easing: Easing.linear,
      }),
      -1,
      true
    );

    opacity.value = withRepeat(
      withTiming(0.1, {
        duration: duration / 2,
        easing: Easing.linear,
      }),
      -1,
      true
    );
  }, []);

  const particleStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: size,
      height: size,
      backgroundColor: '#9f7aea',
      borderRadius: size / 2,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={particleStyle} />;
};

const FloatingShape = ({ style }: { style: any }) => {
  return (
    <Animated.View style={[styles.shape, style]}>
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.4)', 'rgba(79, 70, 229, 0.2)']}
        style={styles.shapeGradient}
      />
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const pulseValue = useSharedValue(1);

  // Floating animation for the title
  const titleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Rotating animation for the shapes
  const shape1Style = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
    };
  });

  const shape2Style = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${-rotate.value * 0.8}deg` },
        { scale: scale.value * 0.8 },
      ],
    };
  });

  const shape3Style = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotate.value * 0.6}deg` },
        { scale: scale.value * 0.6 },
      ],
    };
  });

  // Efecto de pulsación para el botón de inicio
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      shadowOpacity: 0.2 + pulseValue.value * 0.3,
    };
  });

  useEffect(() => {
    // Animación del título flotante
    translateY.value = withRepeat(
      withTiming(15, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Rotación de formas decorativas
    rotate.value = withRepeat(
      withTiming(360, {
        duration: 25000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Escala de las formas decorativas
    scale.value = withRepeat(
      withTiming(1.15, {
        duration: 8000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Efecto pulsante para el botón
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Efecto de hover para el botón
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [rotate, scale, translateY, buttonScale, pulseValue]);

  // Generar array para las partículas
  const particles = Array.from({ length: 30 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={[
          'rgba(17, 24, 39, 1)',
          'rgba(88, 28, 135, 0.9)',
          'rgba(55, 48, 163, 0.7)',
        ]}
        style={styles.background}
      />

      {/* Imagen de fondo con efecto parallax */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={styles.backgroundImageContainer}
      >
        <Image
          source={{ uri: '/placeholder.svg?height=800&width=600' }}
          style={styles.backgroundImage}
          resizeMode='cover'
        />
        <LinearGradient
          colors={[
            'rgba(17, 24, 39, 0.5)',
            'rgba(88, 28, 135, 0.8)',
            'rgba(17, 24, 39, 0.9)',
          ]}
          style={styles.imageOverlay}
        />
      </Animated.View>

      {/* Partículas para ambiente de videojuego */}
      {particles.map((i) => (
        <Particle key={i} index={i} />
      ))}

      {/* Formas animadas */}
      <FloatingShape style={[styles.shape1, shape1Style]} />
      <FloatingShape style={[styles.shape2, shape2Style]} />
      <FloatingShape style={[styles.shape3, shape3Style]} />

      <View style={styles.content}>
        <Animated.View
          entering={ZoomIn.duration(1200).springify()}
          style={[styles.titleContainer, titleStyle]}
        >
          <Text style={styles.title}>GameHub</Text>
          <Text style={styles.subtitle}>Enter the Next Level</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.descriptionContainer}
        >
          <Text style={styles.description}>
            Descubre un mundo de aventuras épicas, batallas multijugador y
            experiencias inmersivas. Tu viaje comienza aquí.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(1000).springify()}
          style={[styles.button, buttonStyle]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('EntryCodeScreen')}
            style={{ width: '100%', height: '100%' }}
          >
            <LinearGradient
              colors={['#9333EA', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>START PLAYING</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(1500).duration(1000)}
          style={styles.featuresContainer}
        >
          <View style={styles.featureItem}>
            <Text style={styles.featureHighlight}>100+</Text>
            <Text style={styles.featureText}>Juegos</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureHighlight}>4K</Text>
            <Text style={styles.featureText}>Gráficos</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureHighlight}>VR</Text>
            <Text style={styles.featureText}>Compatibilidad</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundImageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(147, 51, 234, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 22,
    color: '#E0E7FF',
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(147, 51, 234, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  descriptionContainer: {
    maxWidth: width * 0.8,
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    width: width * 0.7,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 40,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.9,
    maxWidth: 500,
  },
  featureItem: {
    alignItems: 'center',
    padding: 10,
  },
  featureHighlight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9333EA',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E7FF',
    opacity: 0.8,
  },
  shape: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  shapeGradient: {
    flex: 1,
    borderRadius: width * 0.3,
  },
  shape1: {
    top: -width * 0.2,
    right: -width * 0.2,
  },
  shape2: {
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  shape3: {
    top: height * 0.4,
    right: -width * 0.4,
    opacity: 0.7,
  },
});
