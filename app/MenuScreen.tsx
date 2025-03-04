'use client';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';

const { width, height } = Dimensions.get('window');

const MenuItem = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <LinearGradient
        colors={['rgba(40, 40, 60, 0.8)', 'rgba(30, 30, 45, 0.6)']}
        style={styles.menuItemGradient}
      >
        <View style={styles.menuItemIcon}>{icon}</View>
        <Text style={styles.menuItemText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function MenuScreen({ visible = true, onClose }) {
  const router = useRouter();

  const menuOptions = [
    {
      id: 'change',
      icon: <FontAwesome5 name='arrow-left' size={24} color='#CCCCCC' />,
      title: 'Change game',
      onPress: () => {
        onClose && onClose();
        // router.push('/(controller)/GameSelectScreen');
      },
    },
    {
      id: 'add',
      icon: <FontAwesome5 name='user-plus' size={24} color='#CCCCCC' />,
      title: 'Add players',
      onPress: () => {
        onClose && onClose();
        // router.push('/(controller)/AddPlayersScreen');
      },
    },
    {
      id: 'profile',
      icon: <FontAwesome5 name='user' size={24} color='#CCCCCC' />,
      title: 'Profile',
      onPress: () => {
        onClose && onClose();
        // router.push('/(tabs)/profile');
      },
    },
    {
      id: 'help',
      icon: <FontAwesome5 name='question-circle' size={24} color='#CCCCCC' />,
      title: 'Get Help',
      onPress: () => {
        onClose && onClose();
        // router.push('/(tabs)/help');
      },
    },
    {
      id: 'leave',
      icon: <FontAwesome5 name='sign-out-alt' size={24} color='#CCCCCC' />,
      title: 'Leave session',
      onPress: () => {
        onClose && onClose();
        router.push('/');
      },
    },
    {
      id: 'hero',
      icon: (
        <View style={styles.logoIcon}>
          <LinearGradient
            colors={['#9AE01D', '#4D9DE0']}
            style={styles.logoGradient}
          >
            {/* Logo simplified */}
            <View style={styles.logoShape} />
          </LinearGradient>
        </View>
      ),
      title: 'Get AirConsole Hero',
      onPress: () => {
        onClose && onClose();
      },
    },
  ];

  const leftColumnItems = menuOptions.filter((_, index) => index % 2 === 0);
  const rightColumnItems = menuOptions.filter((_, index) => index % 2 === 1);

  const renderMenuContent = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => (onClose ? onClose() : router.back())}
        >
          <Ionicons name='close' size={32} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      <View style={styles.menuColumnsContainer}>
        <View style={styles.menuColumn}>
          {leftColumnItems.map((option) => (
            <MenuItem
              key={option.id}
              icon={option.icon}
              title={option.title}
              onPress={option.onPress}
            />
          ))}
        </View>

        <View style={styles.menuColumn}>
          {rightColumnItems.map((option) => (
            <MenuItem
              key={option.id}
              icon={option.icon}
              title={option.title}
              onPress={option.onPress}
            />
          ))}
        </View>
      </View>
    </>
  );

  if (visible) {
    // Full screen version (not modal)
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F19', '#1F1F2F', '#0A0A14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />

        {renderMenuContent()}
      </View>
    );
  } else {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType='fade'
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(15, 15, 25, 0.95)', 'rgba(10, 10, 20, 0.95)']}
            style={styles.modalBackground}
          />

          {renderMenuContent()}
        </View>
      </Modal>
    );
  }
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuColumnsContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  menuColumn: {
    flex: 1,
    alignItems: 'center',
  },
  menuItem: {
    width: width / 2 - 20,
    height: width / 2 - 20,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItemGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  menuItemIcon: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoShape: {
    width: 30,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '30deg' }],
  },
});
