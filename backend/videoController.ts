import { Request, Response } from "express";
import { VideoAnalysisService } from "../services/videoAnalysis";
import { EventStorageService } from "../services/eventStorage";

export class VideoController {
  static async analyzeVideo(req: Request, res: Response) {
    try {
      const { base64Image, cameraId } = req.body;

      if (!base64Image || !cameraId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // AI Analysis using Gemini
      const analysisResult = await VideoAnalysisService.analyzeFrame(base64Image);
      if (!analysisResult) return res.status(500).json({ error: "AI analysis failed" });

      // Store detected event in Supabase
      const storedEvent = await EventStorageService.storeEvent(
        cameraId, 
        analysisResult.eventType, 
        analysisResult.description
      );

      res.status(200).json({ message: "Analysis successful", event: storedEvent });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
