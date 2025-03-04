import React, { useRef, useEffect } from 'react';
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
  FadeInRight,
  FadeIn,
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
import {
  features,
  teamMembers,
  upcomingFeatures,
} from '@/constants/ExploreFeatures';

const { width } = Dimensions.get('window');

// Enhanced Feature Card with hover animation
const FeatureCard = ({ title, description, imageUrl, index }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(1.05);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 200).springify()}
        style={[styles.card, animatedStyle]}
      >
        <LinearGradient
          colors={['rgba(88, 28, 135, 0.8)', 'rgba(55, 48, 163, 0.6)']}
          style={styles.cardGradient}
        >
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <ThemedText type='title' style={styles.cardTitle}>
              {title}
            </ThemedText>
            <ThemedText style={styles.cardDescription}>
              {description}
            </ThemedText>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// New upcoming feature cards with glowing effect
const NewFeatureCard = ({
  title,
  releaseDate,
  description,
  imageUrl,
  index,
}) => {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 150).springify()}
      style={styles.newFeatureCard}
    >
      <LinearGradient
        colors={['rgba(14, 165, 233, 0.7)', 'rgba(139, 92, 246, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.newFeatureGradient}
      >
        <View style={styles.releaseDateTag}>
          <ThemedText style={styles.releaseDate}>
            Coming {releaseDate}
          </ThemedText>
        </View>
        <Image source={{ uri: imageUrl }} style={styles.newFeatureImage} />
        <View style={styles.newFeatureContent}>
          <ThemedText type='title' style={styles.newFeatureTitle}>
            {title}
          </ThemedText>
          <ThemedText style={styles.newFeatureDescription}>
            {description}
          </ThemedText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

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

// Current features

export default function TabTwoScreen() {
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
            Discover Our Features
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Explore the cutting-edge features that make our gaming platform
            stand out
          </ThemedText>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.id}
              style={createScrollAnimatedComponent(index, 300)}
            >
              <FeatureCard
                title={feature.title}
                description={feature.description}
                imageUrl={feature.imageUrl}
                index={index}
              />
            </Animated.View>
          ))}
        </View>

        {/* NEW: Upcoming Features Section */}
        <View style={styles.upcomingSection}>
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upcomingSectionBackground}
          >
            <View style={styles.upcomingHeader}>
              <ThemedText type='title' style={styles.upcomingTitle}>
                Coming Soon
              </ThemedText>
              <View style={styles.glowingDot}></View>
              <ThemedText style={styles.upcomingSubtitle}>
                Exciting new features on the horizon
              </ThemedText>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingFeaturesContainer}
            >
              {upcomingFeatures.map((feature, index) => (
                <Animated.View
                  key={feature.id}
                  style={createScrollAnimatedComponent(
                    index + features.length,
                    800
                  )}
                >
                  <NewFeatureCard
                    title={feature.title}
                    releaseDate={feature.releaseDate}
                    description={feature.description}
                    imageUrl={feature.imageUrl}
                    index={index}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </LinearGradient>
        </View>

        {/* Enhanced About Us Section */}
        <View style={styles.aboutSection}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'rgba(88, 28, 135, 0.15)']}
            style={styles.aboutCard}
          >
            {/* Team members */}

            <View style={styles.teamContainer}>
              {teamMembers.map((member, index) => (
                <Animated.View
                  key={member.id}
                  style={createScrollAnimatedComponent(
                    index + features.length + upcomingFeatures.length,
                    1200
                  )}
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

            {/* Company stats */}
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
    height: 400,
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
  cardsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 8,
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.9,
  },

  // Upcoming features section styles
  upcomingSection: {
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  upcomingSectionBackground: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  upcomingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upcomingTitle: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  glowingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0ea5e9',
    marginBottom: 10,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  upcomingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  upcomingFeaturesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    gap: 15,
  },
  newFeatureCard: {
    width: width * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  newFeatureGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  releaseDateTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  releaseDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  newFeatureImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  newFeatureContent: {
    padding: 16,
  },
  newFeatureTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#fff',
  },
  newFeatureDescription: {
    fontSize: 14,
    opacity: 0.9,
  },

  // About Us section styles
  aboutSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    marginBottom: 20,
    color: '#fff',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
