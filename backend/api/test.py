import tensorflow as tf
from tensorflow.keras.models import load_model

model = load_model('backend/api/model/model.h5')
print("Model input shape:", model.input_shape)
print("Model output shape:", model.output_shape)