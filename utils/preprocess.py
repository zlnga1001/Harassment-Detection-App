import cv2
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array

# Parameters
SEQUENCE_LENGTH = 20  # Number of frames in one sequence
IMG_SIZE = (64, 64)  # Resize frame

def extract_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, IMG_SIZE)
        frame = img_to_array(frame) / 255.0  # Normalize    
        frames.append(frame)

        if len(frames) == SEQUENCE_LENGTH:
            yield np.array(frames)
            frames = []  # Reset sequence

    cap.release()
