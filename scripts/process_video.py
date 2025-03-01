import sys
import os
import cv2
import numpy as np
import time
from tensorflow.keras.utils import img_to_array
from tensorflow.keras.models import load_model

# Fix the import issue by adding models/ to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models')))

from hfj_model import create_hfj_model

# Parameters
SEQUENCE_LENGTH = 20  # Number of frames in sequence
IMG_SIZE = (64, 64)  # Resize frame
NUM_CLASSES = 3  # Fighting, Fainting, Running

# Check if model exists before loading
if not os.path.exists("models/hfj_model.h5"):
    print("Error: Model file 'hfj_model.h5' not found! Train the model first.")
    sys.exit(1)

# Load the entire trained model
model = load_model("models/hfj_model.h5")


# Action labels
actions = ["Fighting", "Fainting", "Running"]

# Function to process video
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

            # Display result
            print(f"Detected Action: {actions[predicted_action]} (Confidence: {confidence:.2f})")

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
