import { useLocalSearchParams } from "expo-router";
import VideoPlayer, { Shot } from "@/components/basketball/VideoPlayer";
import VideoPicker from "@/components/basketball/VideoPicker";

// dummy data until you load real JSON
const shots: Shot[] = [];

export default function VideoScreen() {
  const { videoUri } = useLocalSearchParams<{ videoUri?: string }>();
  if (!videoUri) return <VideoPicker />;
  return <VideoPlayer videoUri={videoUri} shots={shots} />;
}