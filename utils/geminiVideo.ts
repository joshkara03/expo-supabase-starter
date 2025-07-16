import { genAI } from '../config/gemini';
import { createUserContent } from '@google/genai';
import * as FileSystem from 'expo-file-system';
import { Shot } from "../components/basketball/VideoPlayer";

/**
 * Analyzes a basketball video using Google's Gemini 2.5 Pro API
 * @param videoUri - URI of the video file to analyze
 * @returns Array of shots with feedback
 */
export async function analyzeBasketballVideo(videoUri: string): Promise<Shot[]> {
  try {
    // Read the video file as base64
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log(`Video file size: ${videoBase64.length} bytes`);
    console.log(`Starting video analysis with Gemini 2.5 Pro: ${videoUri}`);
    
    // Simplified prompt that matches what Gemini naturally produces
    const prompt = `Analyze this basketball video and return ONLY a JSON response with this exact structure:

{
  "shots": [
    {
      "time": "mm:ss",
      "outcome": "make" or "miss",
      "feedback": "Brief coaching feedback on form even if shot was made"
    }
  ]
}

For each shot:
- Use the exact time format "mm:ss" (e.g., "00:04", "01:23")
- Use ONLY "make" or "miss" for outcomes - no other variations
- Provide specific feedback on shooting form (elbow alignment, follow-through, balance)
- Identify each shot attempt in the video

Return ONLY valid JSON, no other text or markdown formatting.`;
    
    // Call Gemini 2.5 Pro API with system instruction
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        createUserContent([
          prompt,
          { inlineData: { data: videoBase64, mimeType: "video/mp4" } }
        ]),
      ],
      config: {
        systemInstruction: "You are a basketball coach analyzing shots. Return ONLY a JSON object with a 'shots' array. Each shot must have 'time' in mm:ss format, 'outcome' as either 'make' or 'miss', and 'feedback' with specific form advice. No markdown formatting or explanatory text.",
        temperature: 1,
        topP: 0.95,
        maxOutputTokens: 10000,
        responseSchema: {
          type: "object",
          properties: {
            shots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  outcome: { type: "string", enum: ["make", "miss"] },
                  feedback: { type: "string" }
                },
                required: ["time", "outcome", "feedback"]
              }
            }
          },
          required: ["shots"]
        }
      }
    });
    
    console.log("Gemini 2.5 Pro API response received");
    const responseText = response.text;
    
    // Log the exact raw response before any processing
    console.log("EXACT RAW RESPONSE FROM GEMINI:");
    console.log(responseText);
    console.log("END OF RAW RESPONSE");
    
    // Try to parse the response as JSON
    try {
      // Clean the response text - remove any markdown formatting
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Define normalizer function for consistent shot format
      function normalizeShot(raw: any): Shot {
        // Use time as the primary field (what Gemini 2.5 Pro naturally returns)
        const ts = raw.time ?? raw.timestamp_of_outcome ?? '0:00.0';
        
        // Simple outcome mapping: 'make' → 'made', 'miss' → 'missed'
        let result: 'made' | 'missed' = 'missed';
        if (raw.outcome === 'make' || raw.result === 'made') {
          result = 'made';
        } else if (raw.outcome === 'miss' || raw.result === 'missed') {
          result = 'missed';
        } else if (/make|made|score/i.test(raw.outcome ?? raw.result ?? '')) {
          result = 'made';
        }
        
        // Track shot counts for UI display
        const shotIndex = raw.shotIndex ?? 0;
        const madeCount = result === 'made' ? shotIndex + 1 : shotIndex;
        const missedCount = result === 'missed' ? shotIndex + 1 : shotIndex;
        
        return {
          timestamp_of_outcome: ts,
          result: result,
          shot_type: raw.shot_type ?? 'Jump shot',
          feedback: raw.feedback ?? `${result === 'made' ? 'Good' : 'Missed'} shot at ${ts}`,
          total_shots_made_so_far: madeCount,
          total_shots_missed_so_far: missedCount,
          total_layups_made_so_far: 0,
        };
      }
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = cleanedResponse.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1].trim());
          if (data.shots && Array.isArray(data.shots)) {
            console.log(`Successfully parsed ${data.shots.length} shots from Gemini response`);
            // Add shot index to each shot for tracking counts
            const enrichedArray = data.shots.map((shot: any, index: number) => ({
              ...shot,
              shotIndex: index
            }));
            
            // Apply normalizer to each shot
            const normalizedShots = enrichedArray.map(normalizeShot);
            console.log(`Normalized ${normalizedShots.length} shots`);
            return normalizedShots;
          }
        } catch (innerError) {
          console.warn('Failed to parse JSON from markdown block:', innerError);
        }
      }
      
      // If that fails, try parsing the entire cleaned response
      let data;
      try {
        data = JSON.parse(cleanedResponse);
      } catch (jsonError) {
        console.error('Failed to parse cleaned response as JSON:', jsonError);
        throw new Error('Could not parse response as JSON');
      }
      
      // Extract shots from any of the possible formats
      const rawArray = data.shots ?? data.analysis ?? [];
      if (Array.isArray(rawArray) && rawArray.length > 0) {
        // Add shot index to each shot for tracking counts
        const enrichedArray = rawArray.map((shot: any, index: number) => ({
          ...shot,
          shotIndex: index
        }));
        
        const normalizedShots = enrichedArray.map(normalizeShot);
        console.log(`Successfully parsed and normalized ${normalizedShots.length} shots from Gemini response`);
        return normalizedShots;
      }
      
      throw new Error('Response does not contain valid shots array');
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', responseText);
      
      // Enhanced fallback - try to extract information from descriptive text
      const shots: Shot[] = [];
      const lines = responseText.split('\n');
      
      let shotCount = 0;
      let madeCount = 0;
      let missedCount = 0;
      let layupCount = 0;
      
      // Look for patterns that indicate shots
      const shotPatterns = [
        /shot.*?(made|missed|goes in|misses|scores|through)/gi,
        /shooting.*?(successful|unsuccessful|makes|misses)/gi,
        /ball.*?(goes through|misses|scores|in the net)/gi
      ];
      
      for (const line of lines) {
        for (const pattern of shotPatterns) {
          const matches = line.match(pattern);
          if (matches) {
            shotCount++;
            
            // Determine if shot was made or missed
            const result = /made|goes in|through|scores|successful/i.test(line) ? "made" : "missed";
            
            if (result === "made") {
              madeCount++;
            } else {
              missedCount++;
            }
            
            // Check if it's a layup
            const isLayup = /layup|close.*shot|near.*basket/i.test(line);
            if (isLayup && result === "made") {
              layupCount++;
            }
            
            shots.push({
              timestamp_of_outcome: `0:${String(shotCount * 5).padStart(2, '0')}.0`, // Estimated timestamps
              result: result as "made" | "missed",
              shot_type: isLayup ? "Layup" : "Jump shot",
              feedback: "Unable to analyze shooting form - please try again with a clearer video",
              total_shots_made_so_far: madeCount,
              total_shots_missed_so_far: missedCount,
              total_layups_made_so_far: layupCount
            });
            
            break; // Only count each line once
          }
        }
      }
      
      if (shots.length > 0) {
        console.log(`Extracted ${shots.length} shots from text response using fallback`);
        return shots;
      }
      
      // If all else fails, return at least one shot based on the description
      if (responseText.includes("shot") || responseText.includes("shooting")) {
        console.log("Creating fallback shot from description");
        return [{
          timestamp_of_outcome: "0:05.0",
          result: responseText.includes("through") || responseText.includes("scores") ? "made" : "missed",
          shot_type: "Jump shot",
          feedback: "Unable to analyze shooting form - model returned descriptive text instead of analysis",
          total_shots_made_so_far: responseText.includes("through") || responseText.includes("scores") ? 1 : 0,
          total_shots_missed_so_far: responseText.includes("through") || responseText.includes("scores") ? 0 : 1,
          total_layups_made_so_far: 0
        }];
      }
      
      throw new Error('Could not extract shot information from response');
    }
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}