import sys
import os
import cv2
import numpy as np
import time
from tensorflow.keras.utils import img_to_array
from tensorflow.keras.models import load_model

# Ensure Python finds the models directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models')))

from hfj_model import ACTION_CLASSES  # Import action class names

# Load the trained HFJ model
SEQUENCE_LENGTH = 20
IMG_SIZE = (64, 64)

# Ensure model exists before loading
model_path = "models/hfj_model.h5"
if not os.path.exists(model_path):
    print("Error: Model file 'hfj_model.h5' not found! Train the model first.")
    sys.exit(1)

model = load_model(model_path)  # Load the trained model

def process_video(video_path):
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return
    
    print(f"Processing video: {video_path}")
    
    frames = []
    start_time = time.time()
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Preprocess frame
        frame = cv2.resize(frame, IMG_SIZE)
        frame = img_to_array(frame) / 255.0  # Normalize
        frames.append(frame)
        frame_count += 1

        # Process sequences
        if len(frames) == SEQUENCE_LENGTH:
            input_sequence = np.expand_dims(frames, axis=0)
            predictions = model.predict(input_sequence)[0]  # Get predictions
            predicted_action = np.argmax(predictions)
            confidence = predictions[predicted_action]  # Get confidence score

            # Display detected action
            print(f"Detected Action: {ACTION_CLASSES[predicted_action]} (Confidence: {confidence:.2f})")

            frames = []  # Reset sequence

    cap.release()
    cv2.destroyAllWindows()

    # Calculate FPS
    end_time = time.time()
    total_time = end_time - start_time
    fps = frame_count / total_time
    print(f"Processing Complete! FPS: {fps:.2f}")

# Run on a sample video
process_video("datasets/sample_video.mp4")
