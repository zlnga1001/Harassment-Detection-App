import tensorflow as tf
from tensorflow.keras.layers import Conv2D, LSTM, Dense, Flatten, TimeDistributed, MaxPooling2D, Dropout
from tensorflow.keras.models import Sequential

# Define CNN + LSTM Model
def create_hfj_model(input_shape, num_classes):
    model = Sequential([
        TimeDistributed(Conv2D(32, (3, 3), activation='relu', input_shape=input_shape)),
        TimeDistributed(MaxPooling2D(pool_size=(2, 2))),
        TimeDistributed(Conv2D(64, (3, 3), activation='relu')),
        TimeDistributed(MaxPooling2D(pool_size=(2, 2))),
        TimeDistributed(Flatten()),
        LSTM(64, return_sequences=True),
        Dropout(0.5),
        LSTM(32),
        Dense(32, activation='relu'),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model
