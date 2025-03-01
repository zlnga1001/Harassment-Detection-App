import tensorflow as tf
from tensorflow.keras.layers import Input, Conv2D, LSTM, Dense, Flatten, TimeDistributed, MaxPooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Sequential

# Define Updated Action Classes
ACTION_CLASSES = [
    "Fighting", "Threatening Gestures", "Fainting & Collapse", "Harassment"
]
NUM_CLASSES = len(ACTION_CLASSES)

def create_hfj_model(input_shape, num_classes=NUM_CLASSES):
    model = Sequential([
        # Input Layer
        Input(shape=input_shape),

        # CNN Feature Extraction (Deeper network for better accuracy)
        TimeDistributed(Conv2D(64, (3, 3), activation='relu', padding='same')),
        TimeDistributed(BatchNormalization()),
        TimeDistributed(MaxPooling2D(pool_size=(2, 2))),

        TimeDistributed(Conv2D(128, (3, 3), activation='relu', padding='same')),
        TimeDistributed(BatchNormalization()),
        TimeDistributed(MaxPooling2D(pool_size=(2, 2))),

        TimeDistributed(Conv2D(256, (3, 3), activation='relu', padding='same')),
        TimeDistributed(BatchNormalization()),
        TimeDistributed(MaxPooling2D(pool_size=(2, 2))),

        TimeDistributed(Flatten()),  # Flatten before LSTM

        # LSTM for Temporal Learning
        LSTM(128, return_sequences=True),
        Dropout(0.5),
        LSTM(64, return_sequences=False),
        Dropout(0.5),

        # Fully Connected Layers
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dense(num_classes, activation='softmax')  # Multi-class classification
    ])
    
    # Compile Model with Lower Learning Rate
    model.compile(loss='categorical_crossentropy', optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005), metrics=['accuracy'])
    return model
