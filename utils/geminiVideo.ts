import { geminiVideo } from "@/config/gemini";
import * as FileSystem from 'expo-file-system';
import { Shot } from '@/components/basketball/VideoPlayer';

/**
 * Analyzes a basketball video using Gemini API and returns shot feedback
 * @param videoUri URI of the video to analyze
 * @returns Promise resolving to an array of Shot objects
 */
export async function analyzeBasketballVideo(videoUri: string): Promise<Shot[]> {
  try {
    console.log('Starting video analysis with Gemini API:', videoUri);
    
    // Read the video file as base64
    const base64Video = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Prepare the prompt for basketball shooting form analysis
    const prompt = `
      You are a professional basketball shooting coach, Michael Jordan. Analyze this basketball video and identify key moments 
      where the player is taking shots. For each shot, provide detailed feedback on their shooting form. Just because a shot goes in doesnt mean it was good form. be fair but critial.
      
      Focus specifically on:
      1. Elbow alignment and extension
      2. Follow-through
      3. Balance and body positioning
      4. Release point consistency
      5. Shot arc and trajectory
      
      For each shot detected, return a JSON object with the following structure:
      {
        "shots": [
          {
            "timestamp_of_outcome": "m:ss.S", // When the shot outcome is visible (made or missed)
            "result": "made" or "missed",
            "shot_type": "Jump shot", "Layup", "Three-pointer", etc.,
            "feedback": "Specific, actionable coaching feedback on form",
            "total_shots_made_so_far": number,
            "total_shots_missed_so_far": number,
            "total_layups_made_so_far": number
          },
          // More shots...
        ]
      }
      
      Return ONLY the JSON with no additional text.
    `;
    
    // Call Gemini API with the video
    const response = await geminiVideo.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "video/mp4",
          data: base64Video
        }
      }
    ]);
    
    const responseText = response.response.text();
    console.log('Gemini API response received');
    
    // Parse the JSON response
    try {
      // First try to extract JSON from the response (in case there's any extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0];
          const parsedResponse = JSON.parse(jsonStr);
          
          if (parsedResponse.shots && Array.isArray(parsedResponse.shots)) {
            console.log(`Successfully parsed ${parsedResponse.shots.length} shots from Gemini response`);
            return parsedResponse.shots;
          }
        } catch (jsonError) {
          console.warn('Failed to parse extracted JSON, trying fallback approach');
        }
      }
      
      // If we get here, either no JSON was found or it wasn't valid
      // Let's try to extract structured information from the text response
      console.log('No valid JSON found, attempting to extract shot information from text');
      
      // Look for patterns like "MISSED - Jump shot" or "MADE - Jump shot"
      const shotPatterns = responseText.match(/(?:MISSED|MADE)\s+[-–]\s+([^"\n]+)/g);
      const feedbackSections = responseText.split(/(?:MISSED|MADE)\s+[-–]\s+[^"\n]+/);
      
      if (shotPatterns && shotPatterns.length > 0) {
        const extractedShots: Shot[] = [];
        
        shotPatterns.forEach((pattern, index) => {
          // Skip the first section which is usually intro text
          const feedbackText = index < feedbackSections.length - 1 ? 
            feedbackSections[index + 1].trim() : "";
          
          const result = pattern.toLowerCase().includes('missed') ? 'missed' : 'made';
          const shotType = pattern.replace(/(?:MISSED|MADE)\s+[-–]\s+/i, '').trim();
          
          extractedShots.push({
            timestamp_of_outcome: `0:${30 + index * 5}`, // Approximate timestamp
            result: result,
            shot_type: shotType,
            feedback: feedbackText.substring(0, 200), // Limit feedback length
            total_shots_made_so_far: extractedShots.filter(s => s.result === 'made').length + (result === 'made' ? 1 : 0),
            total_shots_missed_so_far: extractedShots.filter(s => s.result === 'missed').length + (result === 'missed' ? 1 : 0),
            total_layups_made_so_far: extractedShots.filter(s => s.shot_type.toLowerCase().includes('layup') && s.result === 'made').length
          });
        });
        
        if (extractedShots.length > 0) {
          console.log(`Successfully extracted ${extractedShots.length} shots from text response`);
          return extractedShots;
        }
      }
      
      // If all else fails, throw an error
      throw new Error('Could not extract shot information from response');
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', responseText);
      throw new Error('Failed to parse Gemini response');
    }
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}
