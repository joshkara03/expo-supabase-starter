import { gemini } from "@/config/gemini";

export interface ShotJson {
  timestamp_of_outcome: string;  // “m:ss.S”
  result: "made" | "missed";
  shot_type: string;
  feedback: string;
  total_shots_made_so_far: number;
  total_shots_missed_so_far: number;
  total_layups_made_so_far: number;
}

/** Send a Base64 JPEG frame to Gemini and get structured shot feedback. */
export async function analyseFrame(base64: string): Promise<ShotJson | null> {
  const prompt =
    `Return ONLY JSON with keys: timestamp_of_outcome, result (made|missed), ` +
    `shot_type, feedback, total_shots_made_so_far, total_shots_missed_so_far, total_layups_made_so_far.`;

  try {
    const res = await gemini.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType: "image/jpeg" } },
    ]);
    return JSON.parse(res.response.text());
  } catch (e) {
    console.error("Gemini analyseFrame error", e);
    return null;
  }
}