import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
  const [statusMessage, setStatusMessage] = useState('Preparing video for analysis...');
  const [usingExampleData, setUsingExampleData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const analyzeVideo = async () => {
      try {
        // Update status messages to show progress
        if (isMounted) setStatusMessage('Preparing video for analysis...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isMounted) setStatusMessage('Sending video to AI coach...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isMounted) setStatusMessage('AI coach is analyzing your shooting form...');
        
        // Process the video and get shot analysis
        const { shots: results, isExampleData } = await processVideoForCoaching(videoUri);
        
        if (isMounted) {
          if (isExampleData) {
            setUsingExampleData(true);
            setStatusMessage('Using example feedback due to API limitations');
          } else {
            setStatusMessage('Analysis complete! Preparing feedback...');
          }
          
          setProgress(100);
          
          // Check if any shots were detected
          if (results.length === 0) {
            setError('No basketball shots detected in this video. Try recording a video with clearer shots.');
            setAnalyzing(false);
            return;
          }
          
          setShots(results);
          
          // Short delay to show 100% completion before finishing
          setTimeout(() => {
            if (isMounted) setAnalyzing(false);
          }, 1000);
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

    // Progress updates with changing status messages
    const progressInterval = setInterval(() => {
      if (isMounted) {
        setProgress(prev => {
          // Slower progress to give API time to process
          const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 90 ? 1 : 0.5;
          const newProgress = prev + increment;
          
          // Update status messages based on progress
          if (prev < 20 && newProgress >= 20) {
            setStatusMessage('Identifying shot attempts in your video...');
          } else if (prev < 40 && newProgress >= 40) {
            setStatusMessage('Analyzing your shooting form and mechanics...');
          } else if (prev < 60 && newProgress >= 60) {
            setStatusMessage('Evaluating shot trajectory and follow-through...');
          } else if (prev < 80 && newProgress >= 80) {
            setStatusMessage('Generating personalized coaching feedback...');
          }
          
          return newProgress > 95 ? 95 : newProgress;
        });
      }
    }, 800); // Slower updates for more realistic feel

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [videoUri]);

  const handleViewResults = () => {
    // Navigate to video player with the shots data and example data flag
    const encodedShots = encodeURIComponent(JSON.stringify(shots));
    // Log the navigation for debugging
    console.log('Navigating to video player with shots:', shots.length, 'isExampleData:', usingExampleData);
    router.push({
      pathname: '/(protected)/(tabs)/video',
      params: {
        videoUri: videoUri,
        shots: encodedShots,
        isExampleData: usingExampleData ? 'true' : 'false'
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
          <Text className="text-foreground text-xl font-bold mb-4">
            Analyzing Your Basketball Shots
          </Text>
          
          <View className="w-64 h-64 items-center justify-center mb-4">
            <ActivityIndicator size="large" color="#22c55e" />
            {/* Basketball icon visualization using a simple circle */}
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50,
              backgroundColor: '#FF6B00',
              marginTop: 20,
              opacity: 0.8,
              borderWidth: 2,
              borderColor: '#000',
              borderStyle: 'dashed'
            }} />
          </View>
          
          <Text className="text-foreground font-medium text-center mb-4">
            {statusMessage}
          </Text>
          
          <View className="w-80 h-3 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-green-500" 
              style={{ width: `${progress}%` }} 
            />
          </View>
          <Text className="text-gray-500 mt-2 font-medium">{Math.round(progress)}%</Text>
          
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
          <Text className="text-foreground text-center mb-2">
            {shots.length > 0 
              ? `Found ${shots.length} shots in your video. Ready to view your coaching feedback!` 
              : 'No shots detected in this video. Try recording a video with clearer shots.'}
          </Text>
          
          {usingExampleData && (
            <View className="mb-6 p-3 bg-yellow-100 rounded-lg border border-yellow-400">
              <Text className="text-yellow-800 font-medium text-center">
                Note: Using example feedback data due to API limitations.
                Real AI analysis will be available when API quota is restored.
              </Text>
            </View>
          )}
          
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
