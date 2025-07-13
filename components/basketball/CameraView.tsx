import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView as ExpoCameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

/**
 * CameraView
 *  – Requests camera, microphone, and media-library permissions
 *  – Shows a camera preview
 *  – "Record / Stop" button
 *  – Live recording timer (mm:ss)
 *  – Saves the captured video to the device gallery
 *  – Tailwind / NativeWind classes for styling
 */
const BasketballCamera: React.FC = () => {
  const cameraRef = useRef<ExpoCameraView | null>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPerm, setMediaPerm] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0); // seconds

  /* ────────────────── Permissions ────────────────── */
  useEffect(() => {
    (async () => {
      const { status: lib } = await MediaLibrary.requestPermissionsAsync();
      setMediaPerm(lib === "granted");
    })();
  }, []);

  /* ────────────────── Timer ────────────────── */
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRecording) {
      timer = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => timer && clearInterval(timer);
  }, [isRecording]);

  /* ────────────────── Actions ────────────────── */
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync();
      setIsRecording(false);

      if (mediaPerm && video?.uri) {
        await MediaLibrary.saveToLibraryAsync(video.uri);
      }
    } catch (err) {
      console.error("Recording error", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  /* ────────────────── Helper ────────────────── */
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0",
    )}`;

  /* ────────────────── UI States ────────────────── */
  if (!cameraPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Requesting permissions…</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-center text-foreground mb-4">
          Camera access is required to record video.
        </Text>
        <TouchableOpacity
          onPress={requestCameraPermission}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          <Text className="text-white">Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ────────────────── Main Render ────────────────── */
  return (
    <View className="flex-1 bg-black">
      <ExpoCameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
      />

      {/* Overlay controls */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        {isRecording && (
          <Text className="mb-2 text-lg text-white">{fmt(duration)}</Text>
        )}

        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          className={`rounded-full px-6 py-3 ${
            isRecording ? "bg-red-600" : "bg-white"
          }`}
        >
          <Text
            className={`font-bold text-lg ${
              isRecording ? "text-white" : "text-black"
            }`}
          >
            {isRecording ? "Stop" : "Record"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BasketballCamera;