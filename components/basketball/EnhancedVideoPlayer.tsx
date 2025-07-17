import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { MaterialIcons, Feather } from '@expo/vector-icons';

// Import the Shot interface
import { Shot } from "./VideoPlayer";

// Define the props for the EnhancedVideoPlayer component
interface EnhancedVideoPlayerProps {
  videoUri: string;
  shots: Shot[];
  isExampleData?: boolean;
  onExit?: () => void;
}

// Constants for the component
const OVERLAY_TOLERANCE_SECONDS = 2.0; // How close (seconds) the playback position must be to trigger a shot overlay
const OVERLAY_DISPLAY_DURATION = 5000; // 5 seconds in milliseconds

// Helper function to convert timestamp to seconds
const tsToSeconds = (ts: string): number => {
  /* "m:ss.S" → seconds */
  const [m, rest] = ts.split(":");
  return Number(m) * 60 + Number(rest);
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({ 
  videoUri, 
  shots, 
  isExampleData = false,
  onExit 
}) => {
  console.log('EnhancedVideoPlayer rendering with URI:', videoUri);
  console.log('EnhancedVideoPlayer shots data:', shots);
  
  // State for player status and UI
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [selectedShot, setSelectedShot] = useState<(Shot & {seconds: number}) | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [activeShot, setActiveShot] = useState<(Shot & {seconds: number}) | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Refs to prevent unnecessary rerenders
  const selectedShotRef = useRef<(Shot & {seconds: number}) | null>(null);
  const isPlayingRef = useRef(false);
  const activeShotRef = useRef<(Shot & {seconds: number}) | null>(null);
  const lastTimeRef = useRef(0);
  
  // Create a video player instance with the provided URI
  const player = useVideoPlayer(videoUri);
  
  // Convert shot timestamps to seconds for easier comparison
  const shotsSec = useMemo(() => {
    return shots.map((shot) => {
      // Use tsToSeconds instead of tsToMs
      const seconds = tsToSeconds(shot.timestamp_of_outcome);
      return { ...shot, seconds };
    });
  }, [shots]);
  
  // Handle loading state with useEffect
  useEffect(() => {
    let isMounted = true;
    
    // Set a timeout to hide the loading indicator after a short delay
    const loadingTimer = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('Video assumed to be loaded');
      setIsLoading(false);
      setVideoReady(true);
      
      // Use the player's duration property if available
      if (player.duration) {
        setVideoDuration(player.duration);
        console.log('Video duration set to:', player.duration);
      } else {
        setVideoDuration(60); // Default to 1 minute if not available
      }
      
      // We don't auto-play when using native controls
      // The user will control playback directly
      setIsPlaying(false);
      isPlayingRef.current = false;
    }, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimer);
    };
  }, [player, videoUri]);
  
  // Subscribe to time updates from the player
  useEvent(player, 'timeUpdate');
  
  // Access the current playback time directly from the player
  const currentTimeSeconds = player.currentTime || 0;
  
  // Update current position and track playback state
  useEffect(() => {
    // Update position more frequently for smooth timeline updates
    if (currentTimeSeconds >= 0 && Math.abs(currentTimeSeconds - lastTimeRef.current) > 0.05) {
      lastTimeRef.current = currentTimeSeconds;
      setCurrentPosition(currentTimeSeconds);
    }
    
    // Update playing state based on player state
    if (player.playing !== isPlayingRef.current) {
      isPlayingRef.current = !!player.playing;
      setIsPlaying(!!player.playing);
    }
  }, [currentTimeSeconds, player.playing]);
  
  // Additional effect to ensure timeline updates during playback
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (isPlaying && videoReady) {
      intervalId = setInterval(() => {
        const currentTime = player.currentTime || 0;
        if (currentTime !== currentPosition) {
          setCurrentPosition(currentTime);
        }
      }, 100); // Update every 100ms for smooth progress
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, videoReady, player, currentPosition]);
  
  // Check if current time is close to any shot timestamps
  useEffect(() => {
    if (!videoReady) return;
    
    // Find a shot that matches the current time
    const matchingShot = shotsSec.find(
      (s) => Math.abs(currentTimeSeconds - s.seconds) < OVERLAY_TOLERANCE_SECONDS
    );
    
    // Only update state if the shot has changed
    if (matchingShot) {
      if (!selectedShotRef.current || selectedShotRef.current.seconds !== matchingShot.seconds) {
        console.log('FOUND SHOT at time:', currentTimeSeconds.toFixed(1), 'shot time:', matchingShot.seconds);
        console.log('Shot details:', matchingShot);
        selectedShotRef.current = matchingShot;
        setSelectedShot(matchingShot);
        setActiveShot(matchingShot);
        activeShotRef.current = matchingShot;
        setShowFeedback(true);
        
        // DO NOT SEEK during automatic shot detection - this causes choppy playback
        // Only seek when user manually selects a shot
        
        // Auto-hide feedback after 5 seconds
        setTimeout(() => {
          setShowFeedback(false);
        }, 5000);
      }
    } else {
      // Clear the selected shot if no match found
      if (selectedShotRef.current) {
        selectedShotRef.current = null;
        setSelectedShot(null);
        setActiveShot(null);
        activeShotRef.current = null;
        setShowFeedback(false);
      }
    }
  }, [currentTimeSeconds, shotsSec, videoReady]);
  
  // Toggle play/pause - uses native controls under the hood
  const togglePlayback = () => {
    if (isPlayingRef.current) {
      player.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      player.play();
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  };
  
  // Select a shot from the list
  const selectShot = (shot: Shot & {seconds: number}) => {
    console.log('Selected shot at:', shot.seconds);
    
    // Update selected shot state
    setSelectedShot(shot);
    selectedShotRef.current = shot;
    setActiveShot(shot);
    activeShotRef.current = shot;
    setShowFeedback(true);
    
    // Update UI position immediately
    setCurrentPosition(shot.seconds);
    lastTimeRef.current = shot.seconds;
    
    // Seek to the shot position
    seekToPosition(shot.seconds);
    
    // Auto-hide feedback after 5 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 5000);
  };

  // Handle timeline click
  const handleTimelinePress = (e: any) => {
    const { locationX, width } = e.nativeEvent;
    const percentage = Math.max(0, Math.min(1, locationX / width)); // Clamp between 0 and 1
    const newTimeSeconds = percentage * videoDuration;
    
    console.log('Timeline clicked at position', newTimeSeconds, 'seconds');
    
    // Immediately update UI position for responsive feedback
    setCurrentPosition(newTimeSeconds);
    lastTimeRef.current = newTimeSeconds;
    
    // Look for shots near this position
    const nearbyShot = shotsSec.find(
      (s) => Math.abs(newTimeSeconds - s.seconds) < 2
    );
    
    if (nearbyShot) {
      // If there's a shot nearby, select it to show the feedback
      setActiveShot(nearbyShot);
      activeShotRef.current = nearbyShot;
      setSelectedShot(nearbyShot);
      selectedShotRef.current = nearbyShot;
      setShowFeedback(true);
    } else {
      // Clear shot feedback if not near a shot
      setActiveShot(null);
      activeShotRef.current = null;
      setShowFeedback(false);
    }
    
    // Seek to the new position
    seekToPosition(newTimeSeconds);
  };
  
  // Improved seek function
  const seekToPosition = (timeSeconds: number) => {
    try {
      // Clamp the time to valid range
      const clampedTime = Math.max(0, Math.min(videoDuration, timeSeconds));
      
      // Reset any pending seeks and set new position
      player.seekBy(0);
      player.currentTime = clampedTime;
      
      console.log('Seeking to position:', clampedTime);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };
  
  // Add skip forward/backward functions
  const skipForward = () => {
    const newTime = Math.min(videoDuration, currentPosition + 10);
    setCurrentPosition(newTime);
    seekToPosition(newTime);
  };
  
  const skipBackward = () => {
    const newTime = Math.max(0, currentPosition - 10);
    setCurrentPosition(newTime);
    seekToPosition(newTime);
  };

  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}
      
      {/* Main video player container */}
      {!isLoading && (
        <View style={styles.playerContainer}>
          {/* Video player with native controls enabled */}
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.video}
              nativeControls={false} // Disable native controls to use our custom timeline
            />
            
            {/* Exit button */}
            {onExit && (
              <TouchableOpacity 
                style={styles.exitButton} 
                onPress={onExit}
              >
                <MaterialIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            )}

          </View>
          
          {/* Custom timeline control */}
          <View style={styles.timelineContainer}>
            <TouchableOpacity 
              style={styles.playPauseButton} 
              onPress={togglePlayback}
            >
              <MaterialIcons 
                name={isPlaying ? "pause" : "play-arrow"} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={skipBackward}
            >
              <MaterialIcons 
                name="replay-10" 
                size={20} 
                color="#FFF" 
              />
            </TouchableOpacity>
            
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            
            <TouchableOpacity 
              style={styles.timeline} 
              onPress={handleTimelinePress}
              activeOpacity={0.8}
            >
              <View style={styles.timelineTrack}>
                <View 
                  style={[
                    styles.timelineProgress, 
                    { width: `${(currentPosition / videoDuration) * 100}%` }
                  ]}
                />
                
                {/* Shot markers on timeline */}
                {shotsSec.map((shot, index) => (
                  <View 
                    key={`shot-${index}`}
                    style={[
                      styles.shotMarker,
                      { 
                        left: `${(shot.seconds / videoDuration) * 100}%`,
                        backgroundColor: shot.result === 'made' ? '#10B981' : '#EF4444'
                      }
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={skipForward}
            >
              <MaterialIcons 
                name="forward-10" 
                size={20} 
                color="#FFF" 
              />
            </TouchableOpacity>
            
            <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
          </View>
          
          {/* Shot list */}
          <ScrollView style={styles.shotList}>
            <Text style={styles.shotListTitle}>Shot Analysis</Text>
            {shotsSec.map((shot, index) => {
              const isActiveShot = selectedShot && selectedShot.seconds === shot.seconds;
              return (
                <TouchableOpacity 
                  key={`shot-list-${index}`}
                  style={[
                    styles.shotItem,
                    isActiveShot && styles.shotItemActive
                  ]}
                  onPress={() => selectShot(shot)}
                >
                  <View style={styles.shotItemContent}>
                    <View style={styles.shotItemHeader}>
                      <Text style={[
                        styles.shotTimestamp,
                        isActiveShot && styles.shotTimestampActive
                      ]}>{formatTime(shot.seconds)}</Text>
                      <View style={[
                        styles.shotOutcomeBadge, 
                        { backgroundColor: shot.result === 'made' ? '#10B981' : '#EF4444' }
                      ]}>
                        <Text style={styles.shotOutcomeText}>
                          {shot.result === 'made' ? 'Made' : 'Missed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.shotFeedback,
                      isActiveShot && styles.shotFeedbackActive
                    ]}>{shot.feedback}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Define styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  playerContainer: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: '50%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  exitButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  skipButton: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 5,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#111827',
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeText: {
    color: '#FFF',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  timeline: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  timelineTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    position: 'relative',
  },
  timelineProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  shotMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
    marginLeft: -4,
  },
  shotList: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  shotListTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  shotItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    padding: 15,
  },
  shotItemContent: {
    flex: 1,
  },
  shotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shotTimestamp: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  shotOutcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shotOutcomeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shotFeedback: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  shotItemActive: {
    backgroundColor: '#374151',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  shotTimestampActive: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  shotFeedbackActive: {
    color: '#FFF',
    fontWeight: '500',
  },
});

export default EnhancedVideoPlayer;
