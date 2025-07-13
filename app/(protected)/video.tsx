import { useLocalSearchParams } from "expo-router";
import VideoPlayer, { Shot } from "@/components/basketball/VideoPlayer";
import VideoPicker from "@/components/basketball/VideoPicker";
import VideoAnalysis from "@/components/basketball/VideoAnalysis";

// Example shot data format for reference
const exampleShots: Shot[] = [
  {
    timestamp_of_outcome: "0:07.5",
    result: "missed",
    shot_type: "Jump shot (around free-throw line)",
    total_shots_made_so_far: 0,
    total_shots_missed_so_far: 1,
    total_layups_made_so_far: 0,
    feedback: "You're pushing that ball, not shooting it; get your elbow under, extend fully, and follow through."
  },
  {
    timestamp_of_outcome: "0:13.0",
    result: "made",
    shot_type: "Three-pointer",
    total_shots_made_so_far: 1,
    total_shots_missed_so_far: 1,
    total_layups_made_so_far: 0,
    feedback: "It went in, but watch that slight fade keep your shoulders square to the hoop through the whole motion."
  }
];

export default function VideoScreen() {
  const params = useLocalSearchParams<{ videoUri?: string; shots?: string; analyze?: string }>();
  const { videoUri, shots: shotsParam, analyze } = params;
  
  console.log('VideoScreen params:', params);
  console.log('VideoScreen videoUri:', videoUri);
  console.log('VideoScreen analyze:', analyze);
  
  // If no videoUri, show the video picker
  if (!videoUri) {
    console.log('No videoUri, showing VideoPicker');
    return <VideoPicker />;
  }
  
  // If analyze flag is set, show the analysis screen
  if (analyze === 'true') {
    console.log('Analyze flag is true, showing VideoAnalysis');
    return <VideoAnalysis videoUri={videoUri} />;
  }
  
  // Parse shots data if available
  let shotData: Shot[] = [];
  if (shotsParam) {
    try {
      console.log('Parsing shots data from param');
      shotData = JSON.parse(decodeURIComponent(shotsParam));
      console.log('Successfully parsed shots data:', shotData.length, 'shots');
    } catch (e) {
      console.error('Failed to parse shots data:', e);
      // Use example shots as fallback for demo purposes
      console.log('Using example shots as fallback');
      shotData = exampleShots;
    }
  } else {
    // Use example shots as fallback for demo purposes
    console.log('No shots param, using example shots');
    shotData = exampleShots;
  }
  
  console.log('Showing VideoPlayer with URI:', videoUri);
  console.log('Shot data count:', shotData.length);
  
  // Show the video player with shots data
  return <VideoPlayer videoUri={videoUri} shots={shotData} />;
}