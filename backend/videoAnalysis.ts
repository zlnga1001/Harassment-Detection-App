import { genAI } from "../config/gemini";

export class VideoAnalysisService {
  static async analyzeFrame(base64Image: string): Promise<any> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-vision" });

      const response = await model.generateContent([
        {
          image: { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        }
      ]);

      if (!response || response.error) {
        throw new Error("AI analysis failed");
      }

      return {
        eventType: "Suspicious Activity",
        description: JSON.stringify(response.response)
      };
    } catch (error) {
      console.error("Gemini AI Error:", error);
      throw error;
    }
  }
}
