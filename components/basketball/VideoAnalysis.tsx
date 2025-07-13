import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { processVideoForCoaching } from '@/utils/videoProcessor';
import { Shot } from './VideoPlayer';

interface VideoAnalysisProps {
  videoUri: string;
}

export default function VideoAnalysis({ videoUri }: VideoAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const analyzeVideo = async () => {
      try {
        // Process the video and get shot analysis
        const results = await processVideoForCoaching(videoUri);
        
        if (isMounted) {
          setShots(results);
          setAnalyzing(false);
        }
      } catch (err) {
        console.error('Video analysis error:', err);
        if (isMounted) {
          setError('Failed to analyze video. Please try again.');
          setAnalyzing(false);
        }
      }
    };

    // Start analysis
    analyzeVideo();

    // Mock progress updates (since we don't have real-time progress)
    const progressInterval = setInterval(() => {
      if (isMounted) {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [videoUri]);

  const handleViewResults = () => {
    // Navigate to video player with the shots data
    const encodedShots = encodeURIComponent(JSON.stringify(shots));
    // Log the navigation for debugging
    console.log('Navigating to video player with shots:', shots.length);
    router.push({
      pathname: '/(protected)/(tabs)/video',
      params: {
        videoUri: videoUri,
        shots: encodedShots
      }
    });
  };

  const handleCancel = () => {
    // Go back to video picker
    router.push('/(protected)/(tabs)/video');
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <TouchableOpacity 
          onPress={handleCancel}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-bold">Back to Videos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      {analyzing ? (
        <>
          <Text className="text-foreground text-xl font-bold mb-8">
            Analyzing Your Basketball Shots
          </Text>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-foreground mt-4 mb-2">
            AI Coach is reviewing your form...
          </Text>
          <View className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-green-500" 
              style={{ width: `${progress}%` }} 
            />
          </View>
          <Text className="text-gray-500 mt-2">{progress}%</Text>
          
          <TouchableOpacity 
            onPress={handleCancel}
            className="mt-8 bg-gray-500 px-6 py-2 rounded-lg"
          >
            <Text className="text-white">Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-foreground text-xl font-bold mb-4">
            Analysis Complete!
          </Text>
          <Text className="text-foreground text-center mb-8">
            {shots.length > 0 
              ? `Found ${shots.length} shots in your video. Ready to view your coaching feedback!` 
              : 'No shots detected in this video. Try recording a video with clearer shots.'}
          </Text>
          
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              onPress={handleViewResults}
              className="bg-green-500 px-6 py-3 rounded-lg"
              disabled={shots.length === 0}
            >
              <Text className="text-white font-bold">
                View Coaching
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCancel}
              className="bg-gray-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-bold">
                Back to Videos
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
