import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import to_categorical
from hfj_model import create_hfj_model

# Define Updated Action Classes
ACTION_CLASSES = [
    "Fighting", "Threatening Gestures", "Fainting & Collapse", "Harassment"
]
NUM_CLASSES = len(ACTION_CLASSES)
SEQUENCE_LENGTH = 20  # Number of frames in each video
IMG_SIZE = (64, 64)  # Size of each frame
NUM_SAMPLES_PER_CLASS = 100  # Number of synthetic "videos" per class

# Function to Generate Fake Video Data (Simulated Video Sequences)
def generate_dummy_data():
    X, Y = [], []
    
    for label in range(NUM_CLASSES):
        for _ in range(NUM_SAMPLES_PER_CLASS):
            video_sequence = np.random.rand(SEQUENCE_LENGTH, IMG_SIZE[0], IMG_SIZE[1], 3)  # Random RGB frames
            X.append(video_sequence)
            Y.append(label)

    X = np.array(X)
    Y = to_categorical(Y, NUM_CLASSES)  # Convert labels to one-hot encoding
    return X, Y

# Load Synthetic Data
X_train, Y_train = generate_dummy_data()

# Create & Train Model
model = create_hfj_model((SEQUENCE_LENGTH, IMG_SIZE[0], IMG_SIZE[1], 3), NUM_CLASSES)
model.fit(X_train, Y_train, epochs=15, batch_size=8)

# Save Model
model.save("models/hfj_model.h5")
print("Training Complete! Model saved as 'models/hfj_model.h5'")
