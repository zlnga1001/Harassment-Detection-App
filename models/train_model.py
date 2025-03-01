import os
import cv2
import tensorflow as tf  # Add this line
import numpy as np
from tensorflow.keras.utils import to_categorical
from hfj_model import create_hfj_model

# Parameters
SEQUENCE_LENGTH = 20
IMG_SIZE = (64, 64)
NUM_CLASSES = 3
DATASET_PATH = "datasets/"

# Load dataset (organized as /datasets/Fighting/, /datasets/Fainting/, /datasets/Running/)
def load_dataset():
    X, Y = [], []
    class_labels = ["Fighting", "Fainting", "Running"]

    for class_index, class_name in enumerate(class_labels):
        class_path = os.path.join(DATASET_PATH, class_name)
        videos = os.listdir(class_path)

        for video_name in videos:
            cap = cv2.VideoCapture(os.path.join(class_path, video_name))
            frames = []
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                frame = cv2.resize(frame, IMG_SIZE)
                frame = frame / 255.0
                frames.append(frame)
                if len(frames) == SEQUENCE_LENGTH:
                    X.append(frames)
                    Y.append(class_index)
                    frames = []  # Reset

            cap.release()

    X = np.array(X)
    Y = to_categorical(Y, NUM_CLASSES)
    return X, Y


def load_dummy_data():
    X = np.random.rand(100, 20, 64, 64, 3)  # Fake video sequences
    Y = np.random.randint(0, 3, 100)  # Random labels (0 = Fighting, 1 = Fainting, 2 = Running)
    Y = tf.keras.utils.to_categorical(Y, 3)  # One-hot encode labels
    return X, Y


# Train Model
X_train, Y_train = load_dummy_data()
model = create_hfj_model((SEQUENCE_LENGTH, IMG_SIZE[0], IMG_SIZE[1], 3), NUM_CLASSES)


# Train
model.fit(X_train, Y_train, epochs=10, batch_size=8)
model.save("models/hfj_model.h5")
