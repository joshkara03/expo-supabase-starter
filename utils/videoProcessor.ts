import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Video } from 'expo-av';
import { Platform } from 'react-native';
import { analyseFrame } from './geminiShot';
import { analyzeBasketballVideo } from './geminiVideo';
import { Shot } from '@/components/basketball/VideoPlayer';

// How many frames to extract per second of video
const FRAMES_PER_SECOND = 1;
// How many seconds to wait between Gemini API calls
const ANALYSIS_INTERVAL_SEC = 2;

/**
 * Result of video processing, including shots and metadata
 */
export interface VideoProcessingResult {
  shots: Shot[];
  isExampleData: boolean;
}

/**
 * Process a video for basketball coaching feedback using Gemini API
 * @param videoUri URI of the video to process
 * @returns Promise resolving to VideoProcessingResult with shots and metadata
 */
export async function processVideoForCoaching(videoUri: string): Promise<VideoProcessingResult> {
  console.log('Processing video for coaching:', videoUri);
  
  try {
    // Check if the video file exists
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error(`Video file not found: ${videoUri}`);
    }
    
    console.log('Video file size:', fileInfo.size, 'bytes');
    
    // If the video is too large (>20MB), we'll need to compress it
    const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
    
    let processedVideoUri = videoUri;
    if (fileInfo.size > MAX_VIDEO_SIZE) {
      console.log('Video is too large, compression would be needed');
      // In a production app, you would implement video compression here
      // For now, we'll proceed with the original video and handle potential API limitations
    }
    
    // Use the new Gemini video analysis function
    try {
      const shots = await analyzeBasketballVideo(processedVideoUri);
      console.log('Video analysis complete, shots detected:', shots.length);
      return {
        shots,
        isExampleData: false
      };
    } catch (error: any) {
      console.error('Error during video analysis:', error);
      
      // Check if it's a quota error
      const errorMessage = (error?.toString() || '').toLowerCase();
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('rate limit') || 
                          errorMessage.includes('429');
      
      // Fall back to example data if the API fails
      console.log('Falling back to example shot data');
      return {
        shots: getExampleShotData(),
        isExampleData: true
      };
    }
  } catch (error) {
    console.error('Error in processVideoForCoaching:', error);
    
    // Return example data as fallback
    return {
      shots: getExampleShotData(),
      isExampleData: true
    };
  }
}

/**
 * Returns example shot data for testing or fallback purposes
 */
function getExampleShotData(): Shot[] {
  return [
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
    },
    {
      timestamp_of_outcome: "0:21.5",
      result: "made",
      shot_type: "Layup",
      total_shots_made_so_far: 2,
      total_shots_missed_so_far: 1,
      total_layups_made_so_far: 1,
      feedback: "Drive that knee on the layup, protect the ball higher with your off-hand, and finish decisively."
    }
  ];
}
  
// Note: The frame extraction code below is kept for reference but is not used in the current implementation
// In a production app with more advanced requirements, you might want to implement frame extraction
// instead of sending the entire video to the API

/*
// Create a temporary Video component to get video metadata
const video = new Video({});

try {
  // Load the video to get its duration
  return new Promise((resolve, reject) => {
    video.loadAsync({ uri: videoUri }, {}, false)
      .then(status => {
        if (!status.isLoaded || !status.durationMillis) {
          reject(new Error('Could not load video metadata'));
          return;
        }
        
        const durationMs = status.durationMillis;
        const durationSec = Math.floor(durationMs / 1000);
        console.log(`Video duration: ${durationSec} seconds`);
        
        // Calculate frame extraction points (every N seconds)
        const framePoints = [];
        for (let i = 0; i < durationSec; i += ANALYSIS_INTERVAL_SEC) {
          framePoints.push(i * 1000); // Convert to milliseconds
        }
        
        // Process the frames sequentially to avoid memory issues
        processFramesSequentially(videoUri, framePoints)
          .then(shots => {
            console.log(`Processed ${shots.length} shots`);
            resolve(shots);
          })
          .catch(reject);
      })
      .catch(reject);
  });
} finally {
  // Clean up
  video.unloadAsync();
}
*/

/**
 * Process video frames sequentially to avoid memory issues
 */
async function processFramesSequentially(
  videoUri: string, 
  framePoints: number[]
): Promise<Shot[]> {
  const shots: Shot[] = [];
  let shotsMade = 0;
  let shotsMissed = 0;
  let layupsMade = 0;
  
  for (let i = 0; i < framePoints.length; i++) {
    const frameMs = framePoints[i];
    try {
      // Extract frame at the specified position
      const frameUri = await extractFrameFromVideo(videoUri, frameMs);
      if (!frameUri) continue;
      
      // Convert frame to base64
      const base64 = await fileToBase64(frameUri);
      
      // Analyze the frame with Gemini
      const analysis = await analyseFrame(base64);
      
      // Clean up the temporary frame file
      await FileSystem.deleteAsync(frameUri, { idempotent: true });
      
      if (analysis) {
        // Update shot counters
        if (analysis.result === 'made') {
          shotsMade++;
          if (analysis.shot_type.toLowerCase().includes('layup')) {
            layupsMade++;
          }
        } else {
          shotsMissed++;
        }
        
        // Create a Shot object with the analysis data
        const shot: Shot = {
          ...analysis,
          total_shots_made_so_far: shotsMade,
          total_shots_missed_so_far: shotsMissed,
          total_layups_made_so_far: layupsMade
        };
        
        shots.push(shot);
        console.log(`Processed shot at ${analysis.timestamp_of_outcome}: ${analysis.result}`);
      }
    } catch (error) {
      console.error(`Error processing frame at ${frameMs}ms:`, error);
    }
  }
  
  return shots;
}

/**
 * Extract a single frame from a video at the specified position
 */
async function extractFrameFromVideo(videoUri: string, positionMs: number): Promise<string | null> {
  // Create a unique filename for the extracted frame
  const frameFileName = `frame_${Date.now()}.jpg`;
  const framePath = `${FileSystem.cacheDirectory}${frameFileName}`;
  
  try {
    // Use FFmpeg to extract the frame (this would require expo-av to support frame extraction)
    // Since expo-av doesn't directly support frame extraction, we'd need a workaround
    
    // For now, we'll use a mock implementation that returns a placeholder
    // In a real implementation, you would use a library like react-native-ffmpeg
    // or implement a native module for frame extraction
    
    // This is a placeholder - in a real app you would extract actual frames
    const placeholderImage = require('@/assets/images/frame-placeholder.jpg');
    
    // In a real implementation, you would extract the actual frame at positionMs
    // and save it to framePath
    
    return framePath;
  } catch (error) {
    console.error('Error extracting frame:', error);
    return null;
  }
}

/**
 * Convert a file to base64
 */
async function fileToBase64(uri: string): Promise<string> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
}
