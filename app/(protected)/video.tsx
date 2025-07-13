import { useLocalSearchParams } from "expo-router";
import VideoPlayer, { Shot } from "@/components/basketball/VideoPlayer";

// dummy data until you load real JSON
const shots: Shot[] = [];

export default function VideoScreen() {
  const { videoUri } = useLocalSearchParams<{ videoUri?: string }>();
  if (!videoUri) return null;          // nothing to show yet
  return <VideoPlayer videoUri={videoUri} shots={shots} />;
}