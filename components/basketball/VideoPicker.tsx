import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

const VideoPicker = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Request permission when needed
  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  // Handle picking a video using the native iOS picker
  const pickVideo = async () => {
    // First check/request permissions
    const permissionGranted = await requestPermission();
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'This app needs access to your media library to play videos.');
      return;
    }

    try {
      // Launch the image picker with video option
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        console.log('Selected video with URI:', videoUri);
        
        // Navigate to video player screen with the video URI
        router.push({
          pathname: '/(protected)/(tabs)/video',
          params: { videoUri }
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Could not access the selected video.');
    }
  };

  // Handle video analysis
  const pickVideoForAnalysis = async () => {
    // First check/request permissions
    const permissionGranted = await requestPermission();
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'This app needs access to your media library to analyze videos.');
      return;
    }

    try {
      // Launch the image picker with video option
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        console.log('Analyzing video with URI:', videoUri);
        
        // Navigate to video analysis screen with the video URI
        router.push({
          pathname: '/(protected)/(tabs)/video',
          params: { videoUri, analyze: 'true' }
        });
      }
    } catch (error) {
      console.error('Error picking video for analysis:', error);
      Alert.alert('Error', 'Could not access the selected video for analysis.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basketball Video Coach</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.recordButton]} 
          onPress={() => router.replace({ pathname: '/(protected)/(tabs)' })}>
          <Text style={styles.buttonText}>Record Shots</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.analyzeButton]} onPress={pickVideoForAnalysis}>
          <Text style={[styles.buttonText, styles.analyzeButtonText]}>Pick Video for AI Coaching</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instructions}>
        Select a video from your library to play or analyze with AI coaching feedback.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%',
  },
  recordButton: {
    backgroundColor: '#FF6B35', // Basketball orange
  },
  analyzeButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  analyzeButtonText: {
    color: '#FF6B35',
  },
});

export default VideoPicker;