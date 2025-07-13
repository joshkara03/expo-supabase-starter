import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { router } from "expo-router";

// Move VideoRow outside the main component
const VideoRow: React.FC<{ asset: MediaLibrary.Asset }> = ({ asset }) => {
  const [thumbUri, setThumbUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 1000,
        });
        if (mounted) setThumbUri(uri);
      } catch {
        if (mounted) setThumbUri(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [asset.uri]);

  return (
    <TouchableOpacity
      className="flex-row items-center p-3 border-b border-gray-700"
      onPress={async () => {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          const playableUri = (info as any).localUri ?? asset.uri;
          router.push(
            `/(protected)/(tabs)/video?videoUri=${encodeURIComponent(playableUri)}`
          );
        } catch {
          router.push(
            `/(protected)/(tabs)/video?videoUri=${encodeURIComponent(asset.uri)}`
          );
        }
      }}
    >
      {thumbUri && (
        <Image
          source={{ uri: thumbUri }}
          style={{ width: 64, height: 64, borderRadius: 4, marginRight: 12 }}
        />
      )}
      <Text className="text-white flex-shrink">{asset.filename}</Text>
    </TouchableOpacity>
  );
};

export default function VideoPicker() {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      const res = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        first: 50,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      setAssets(res.assets);
    })();
  }, []);

  if (!assets.length) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">No videos found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={assets}
      keyExtractor={(a) => a.id}
      renderItem={({ item }) => <VideoRow asset={item} />}
    />
  );
}