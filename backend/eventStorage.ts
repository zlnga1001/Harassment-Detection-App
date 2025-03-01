import { supabase } from "../config/supabase";

export class EventStorageService {
  static async storeEvent(cameraId: string, eventType: string, description: string) {
    try {
      const { data, error } = await supabase.from("events").insert([
        { camera_id: cameraId, event_type: eventType, description }
      ]);

      if (error) throw new Error(error.message);

      return data;
    } catch (error) {
      console.error("Supabase Error:", error);
      throw error;
    }
  }
}
