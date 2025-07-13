import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
export interface Shot {
  timestamp_of_outcome: string;          // e.g. "0:07.5"
  result: "made" | "missed";
  shot_type: string;
  total_shots_made_so_far: number;
  total_shots_missed_so_far: number;
  total_layups_made_so_far: number;
  feedback: string;
}

interface VideoPlayerProps {
  videoUri: string;
  shots: Shot[];
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
const tsToMs = (ts: string): number => {
  /* "m:ss.S" → milliseconds */
  const [m, rest] = ts.split(":");
  return (Number(m) * 60 + Number(rest)) * 1000;
};

// How close (seconds) the playback position must be to trigger a shot overlay
const OVERLAY_TOLERANCE_SECONDS = 1.5; // Increased from 0.7 to make detection more reliable

// ─────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────
const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUri, shots }) => {
  console.log('VideoPlayer rendering with URI:', videoUri);
  console.log('VideoPlayer shots data:', shots);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Create a video player instance with the provided URI
  const player = useVideoPlayer(videoUri);
  
  // Handle loading state with useEffect
  useEffect(() => {
    // Set a timeout to hide the loading indicator after a short delay
    // This is a simple workaround since we don't have direct load events
    const loadingTimer = setTimeout(() => {
      console.log('Video assumed to be loaded');
      setIsLoading(false);
      // Try to play the video
      try {
        player.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }, 1500); // Wait 1.5 seconds before assuming video is loaded
    
    return () => clearTimeout(loadingTimer);
  }, [player, videoUri]);
  
  // Subscribe to time updates from the player
  useEvent(player, 'timeUpdate');
  
  // Access the current playback time directly from the player
  const currentTimeSeconds = player.currentTime || 0;
  
  // Pre-compute shot lookup in seconds for efficiency
  const shotsSec = useMemo(
    () =>
      shots.map((s) => ({
        ...s,
        seconds: tsToMs(s.timestamp_of_outcome) / 1000, // Convert ms to seconds
      })),
    [shots],
  );

  /* ───────────── Overlay logic ───────────── */
  // Track which shot is active based on current time
  const [activeShot, setActiveShot] = useState<Shot | null>(null);
  const [showDebugOverlay, setShowDebugOverlay] = useState(true);
  
  // Update active shot whenever the time changes
  useEffect(() => {
    const positionSeconds = currentTimeSeconds;
    
    // Log every second for debugging
    if (positionSeconds > 0 && Math.floor(positionSeconds * 10) % 10 === 0) {
      console.log('Current position (seconds):', positionSeconds.toFixed(1));
    }
    
    // Find a shot that matches the current time
    const matchingShot = shotsSec.find(
      (s) => Math.abs(positionSeconds - s.seconds) < OVERLAY_TOLERANCE_SECONDS
    );
    
    if (matchingShot) {
      console.log('FOUND SHOT at time:', positionSeconds.toFixed(1), 'shot time:', matchingShot.seconds);
      console.log('Shot details:', matchingShot);
      setActiveShot(matchingShot);
    } else {
      // Clear active shot when not near any shot timestamp
      if (activeShot) {
        setActiveShot(null);
      }
    }
  }, [currentTimeSeconds, shotsSec]);
  
  // Log all shot timestamps on mount
  useEffect(() => {
    console.log('All shot timestamps (seconds):', shotsSec.map(s => s.seconds));
    
    // Toggle debug overlay every 5 seconds to ensure it's visible
    const debugInterval = setInterval(() => {
      setShowDebugOverlay(prev => !prev);
    }, 5000);
    
    return () => clearInterval(debugInterval);
  }, [shotsSec]);

  /* ───────────── Render ───────────── */
  useEffect(() => {
    console.log('VideoPlayer mounted with URI:', videoUri);
    console.log('Shot timestamps (seconds):', shotsSec.map(s => s.seconds));
    return () => {
      console.log('VideoPlayer unmounting');
    };
  }, [videoUri, shotsSec]);

  return (
    <View className="flex-1 bg-black">
      {isLoading && (
        <View className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4">Loading video...</Text>
        </View>
      )}
      
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="contain"
        nativeControls={true}
        allowsFullscreen={true}
      />

      {/* Always visible test overlay */}
      <View className="absolute top-20 left-4 bg-red-500 p-2 rounded">
        <Text className="text-white text-xs font-bold">
          TEST OVERLAY ALWAYS VISIBLE
        </Text>
      </View>

      {/* Shot feedback overlay that appears based on current time */}
      {activeShot && (
        <View className="absolute inset-x-4 bottom-32 rounded-lg bg-black p-4 border-4 border-yellow-400">
          <Text
            className={`text-center text-xl font-bold ${
              activeShot.result === "made" ? "text-green-400" : "text-red-400"
            }`}
          >
            {activeShot.result.toUpperCase()} – {activeShot.shot_type}
          </Text>
          <Text className="mt-2 text-center text-base text-white font-medium">
            {activeShot.feedback}
          </Text>
        </View>
      )}
      
      {/* Debug overlay that blinks to ensure rendering is working */}
      {showDebugOverlay && (
        <View className="absolute top-4 right-4 bg-black/70 p-2 rounded">
          <Text className="text-white text-xs">
            Time: {currentTimeSeconds.toFixed(1)}s
          </Text>
          <Text className="text-yellow-400 text-xs">
            Shot times: {shotsSec.map(s => s.seconds.toFixed(1)).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default VideoPlayer;