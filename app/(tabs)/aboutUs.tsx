import React, { useRef } from 'react';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width } = Dimensions.get('window');

// Team member component for About Us section
const TeamMember = ({ name, role, imageUrl, index }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.teamMemberCard}
    >
      <Image source={{ uri: imageUrl }} style={styles.teamMemberImage} />
      <View style={styles.teamMemberInfo}>
        <ThemedText type='title' style={styles.teamMemberName}>
          {name}
        </ThemedText>
        <ThemedText style={styles.teamMemberRole}>{role}</ThemedText>
      </View>
    </Animated.View>
  );
};

// Team members for About Us section
const teamMembers = [
  {
    id: 1,
    name: 'Michael Linares',
    role: 'Lead Game Designer',
    imageUrl: '/placeholder.svg?height=120&width=120',
  },
  {
    id: 2,
    name: 'Sophia Chen',
    role: 'Creative Director',
    imageUrl: '/placeholder.svg?height=120&width=120',
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    role: 'Lead Developer',
    imageUrl: '/placeholder.svg?height=120&width=120',
  },
];

export default function AboutScreen() {
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  // Handler for scroll animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Create animated cards that respond to scroll position
  const createScrollAnimatedComponent = (index, startPosition = 100) => {
    const position = index * 200 + startPosition;
    return useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [position - 400, position - 150],
        [0, 1],
        Extrapolate.CLAMP
      );

      const translateY = interpolate(
        scrollY.value,
        [position - 400, position - 150],
        [100, 0],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [{ translateY }],
      };
    });
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <ThemedView style={styles.content}>
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: '/placeholder.svg?height=500&width=800' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={[
              'rgba(15, 15, 26, 0)',
              'rgba(15, 15, 26, 0.8)',
              'rgba(15, 15, 26, 1)',
            ]}
            style={styles.heroGradient}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ThemedText type='title' style={styles.heroTitle}>
            About us
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Meet the passionate people behind our amazing products
          </ThemedText>
        </View>

        {/* Enhanced About Us Section */}
        <View style={styles.aboutSection}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'rgba(88, 28, 135, 0.15)']}
            style={styles.aboutCard}
          >
            <ThemedText style={styles.aboutText}>
              We are a passionate team of game developers and creators dedicated
              to bringing you the most immersive and exciting gaming
              experiences. Our mission is to push the boundaries of what's
              possible in gaming and create unforgettable adventures for players
              worldwide.
            </ThemedText>

            {/* Company stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText type='title' style={styles.statNumber}>
                  10+
                </ThemedText>
                <ThemedText style={styles.statLabel}>Games</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='title' style={styles.statNumber}>
                  1M+
                </ThemedText>
                <ThemedText style={styles.statLabel}>Global Players</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='title' style={styles.statNumber}>
                  24/7
                </ThemedText>
                <ThemedText style={styles.statLabel}>Support</ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ThemedView>
      <ThemedView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ThemedText type='title' style={styles.heroTitle}>
            Our Team
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Meet the passionate people behind our amazing products
          </ThemedText>
        </View>

        {/* Enhanced About Us Section */}
        <View style={styles.aboutSection}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'rgba(88, 28, 135, 0.15)']}
            style={styles.aboutCard}
          >
            <ThemedText style={styles.aboutText}>
              We are a passionate team of game developers and creators dedicated
              to bringing you the most immersive and exciting gaming
              experiences. Our mission is to push the boundaries of what's
              possible in gaming and create unforgettable adventures for players
              worldwide.
            </ThemedText>

            {/* Team members */}
            <ThemedText type='title' style={styles.teamTitle}>
              Meet Our Team
            </ThemedText>

            <View style={styles.teamContainer}>
              {teamMembers.map((member, index) => (
                <Animated.View
                  key={member.id}
                  style={createScrollAnimatedComponent(index, 300)}
                >
                  <TeamMember
                    name={member.name}
                    role={member.role}
                    imageUrl={member.imageUrl}
                    index={index}
                  />
                </Animated.View>
              ))}
            </View>
          </LinearGradient>
        </View>
      </ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    padding: 20,
  },
  heroImageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: '80%',
  },
  aboutSection: {
    marginBottom: 40,
  },
  aboutCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.9,
  },
  teamTitle: {
    fontSize: 22,
    marginBottom: 15,
    color: '#fff',
    textAlign: 'center',
  },
  teamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  teamMemberCard: {
    width: width / 3.5,
    alignItems: 'center',
    marginBottom: 15,
  },
  teamMemberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  teamMemberInfo: {
    alignItems: 'center',
  },
  teamMemberName: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  teamMemberRole: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    color: '#6366f1',
    marginBottom: 4,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});
