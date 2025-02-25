'use client';

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Input from '@/components/Input';

const musicCategories = [
  'Pop',
  'Rock',
  'Hip Hop',
  'R&B',
  'Country',
  'Electronic',
  'Jazz',
  'Classical',
  '80s',
  '90s',
  '2000s',
];

export default function HostRoomCreationScreen() {
  const [roomName, setRoomName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const navigation = useNavigation();

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleCreateRoom = () => {
    if (roomName && selectedCategories.length > 0) {
      // In a real app, you'd generate a unique room code here
      const roomCode = Math.random().toString(36).substring(7).toUpperCase();
      navigation.navigate('WaitingRoomScreen', { roomCode, isHost: true });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a Room</Text>
      <Input
        placeholder='Enter Room Name'
        value={roomName}
        onChangeText={setRoomName}
      />
      <Text style={styles.subtitle}>Select Music Categories:</Text>
      <View style={styles.categoriesContainer}>
        {musicCategories.map((category) => (
          <Button
            key={category}
            title={category}
            onPress={() => toggleCategory(category)}
            style={[
              styles.categoryButton,
              selectedCategories.includes(category) && styles.selectedCategory,
            ]}
          />
        ))}
      </View>
      <Button title='Create Room' onPress={handleCreateRoom} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  categoryButton: {
    margin: 5,
    minWidth: 100,
  },
  selectedCategory: {
    backgroundColor: '#2196F3',
  },
});
