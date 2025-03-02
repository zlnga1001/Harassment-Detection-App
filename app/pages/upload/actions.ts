"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    throw new Error('Missed GOOGLE_API_KEY environment');
}
const genAI = new GoogleGenerativeAI(API_KEY);

export interface VideoEvent {
    timestamp: string;
    description: string;
    isDangerous: boolean;
}

export async function detectEvents(base64Image: string, transcript: string = ''): Promise<{ events: VideoEvent[], rawResponse: string }> {
    console.log('Starting frame analysis...');
    try {
        if (!base64Image) {
            throw new Error("No image data provided");
        }

        const base64Data = base64Image.split(',')[1];
        if (!base64Data) {
            throw new Error("Invalid image data format");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('Initialized Gemini model');

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
            },
        };

        console.log('Sending image to API...', { imageSize: base64Data.length });
        const prompt = `Analyze this frame and determine if any of the following harassment or abusive behaviors are occurring:

1. **Physical Harassment:**
   - Unwanted physical contact (grabbing, pushing, hitting)
   - Aggressive body language or threatening gestures
   - Blocking someone's movement or invading personal space aggressively

2. **Verbal and Emotional Harassment:**
   - Yelling, shouting, or aggressive verbal confrontations
   - Insulting, degrading, or humiliating speech
   - Repeated unwanted attention or intimidation

3. **Sexual Harassment:**
   - Inappropriate physical advances (touching, groping, or forced proximity)
   - Lewd gestures, suggestive body language, or indecent exposure
   - Recording or taking photos of someone without consent in a sensitive context

4. **Bullying and Intimidation:**
   - Multiple individuals surrounding or cornering someone
   - Mocking, taunting, or public shaming
   - Intentional exclusion or coercion

5. **Discriminatory Harassment:**
   - Visible racial, gender-based, or disability-related aggression
   - Hate symbols, offensive gestures, or speech targeting identity groups
   - Threats based on race, gender, sexuality, or other protected attributes

6. **Retaliatory Behavior:**
   - Confrontations following a report or complaint
   - Escalating aggression towards someone trying to leave or avoid conflict
   - Intimidation aimed at silencing or punishing someone

Detect any clear indicators of these behaviors and determine whether immediate intervention might be necessary.
${transcript ? `Consider this audio transcript from the scene: "${transcript}"
` : ''}
Return a JSON object in this exact format:

{
    "events": [
        {
            "timestamp": "mm:ss",
            "description": "Brief description of what's happening in this frame",
            "isDangerous": true/false // Set to true if the event involves a fall, injury, unease, pain, accident, or concerning behavior
        }
    ]
}`;

        try {
            const result = await model.generateContent([
                prompt,
                imagePart,
            ]);

            const response = await result.response;
            const text = response.text();
            console.log('Raw API Response:', text);

            // Try to extract JSON from the response, handling potential code blocks
            let jsonStr = text;
            
            // First try to extract content from code blocks if present
            const codeBlockMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
                console.log('Extracted JSON from code block:', jsonStr);
            } else {
                // If no code block, try to find raw JSON
                const jsonMatch = text.match(/\{[^]*\}/);  
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                    console.log('Extracted raw JSON:', jsonStr);
                }
            }

            try {
                const parsed = JSON.parse(jsonStr);
                return {
                    events: parsed.events || [],
                    rawResponse: text
                };
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                throw new Error('Failed to parse API response');
            }

        } catch (error) {
            console.error('Error calling API:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in detectEvents:', error);
        throw error;
    }
}
