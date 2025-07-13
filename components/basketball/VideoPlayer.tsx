import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Video, AVPlaybackStatusSuccess } from "expo-av";
import Slider from "@react-native-community/slider"; // `expo install @react-native-community/slider`
import { Ionicons } from "@expo/vector-icons";

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

// How close (ms) the playback position must be to trigger a shot overlay
const OVERLAY_TOLERANCE = 700;

// ─────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────
const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUri, shots }) => {
  const videoRef = useRef<Video | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);

  // Pre-compute shot lookup in ms for efficiency
  const shotsMs = useMemo(
    () =>
      shots.map((s) => ({
        ...s,
        ms: tsToMs(s.timestamp_of_outcome),
      })),
    [shots],
  );

  /* ───────────── Playback callbacks ───────────── */
  const onStatusUpdate = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setStatus(s);
  };

  const togglePlay = () => {
    if (!status || !videoRef.current) return;
    if (status.isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
  };

  const onSeek = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value);
  };

  /* ───────────── Overlay logic ───────────── */
  const activeShot = useMemo(() => {
    if (!status?.positionMillis) return undefined;
    return shotsMs.find(
      (s) =>
        Math.abs(status.positionMillis - s.ms) < OVERLAY_TOLERANCE,
    );
  }, [status?.positionMillis, shotsMs]);

  /* ───────────── Durations ───────────── */
  const total = status?.durationMillis ?? 1;
  const position = status?.positionMillis ?? 0;

  /* ───────────── Render ───────────── */
  return (
    <View className="flex-1 bg-black">
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        resizeMode="contain"
        style={{ flex: 1 }}
        onPlaybackStatusUpdate={onStatusUpdate}
        useNativeControls={false}
      />

      {/* Overlay for shot feedback */}
      {activeShot && (
        <View className="absolute inset-x-4 bottom-32 rounded-lg bg-black/70 p-4">
          <Text
            className={`text-center text-base font-bold ${
              activeShot.result === "made" ? "text-green-400" : "text-red-400"
            }`}
          >
            {activeShot.result.toUpperCase()} – {activeShot.shot_type}
          </Text>
          <Text className="mt-1 text-center text-sm text-white">
            {activeShot.feedback}
          </Text>
        </View>
      )}

      {/* Controls */}
      <View className="absolute bottom-4 left-0 right-0 px-4">
        {/* Time slider */}
        <Slider
          value={position}
          minimumValue={0}
          maximumValue={total}
          minimumTrackTintColor="#22c55e" // green-500
          maximumTrackTintColor="#ffffff"
          thumbTintColor="#22c55e"
          onSlidingComplete={onSeek}
        />

        {/* Play / pause row */}
        <View className="mt-2 flex-row items-center justify-between">
          <TouchableOpacity onPress={togglePlay}>
            <Ionicons
              name={status?.isPlaying ? "pause" : "play"}
              size={32}
              color="#ffffff"
            />
          </TouchableOpacity>
          <Text className="text-white">
            {Math.floor(position / 1000)
              .toString()
              .padStart(2, "0")}
            /
            {Math.floor(total / 1000)
              .toString()
              .padStart(2, "0")}
            s
          </Text>
        </View>
      </View>
    </View>
  );
};

export default VideoPlayer;