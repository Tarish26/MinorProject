import numpy as np
import tensorflow as tf
from PIL import Image
import os

# Model configuration
MODEL_INPUT_SIZE = (299, 299)
CLASS_NAMES = ['Glioma', 'Meningioma', 'No Tumour', 'Pituitary']

# Load model once
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, 'model', 'model.h5')
model = tf.keras.models.load_model(model_path)

def preprocess_image(file_obj):
    """Preprocess image to match training (rescale=1/255, no extra preprocessing)"""
    img = Image.open(file_obj).convert('RGB')
    img = img.resize(MODEL_INPUT_SIZE)

    img_array = np.array(img, dtype=np.float32) / 255.0  # match rescale=1/255
    img_array = np.expand_dims(img_array, axis=0)  # add batch dim

    return img_array

def predict_tumor_type(file_obj):
    """Make prediction using the loaded model"""
    img_array = preprocess_image(file_obj)
    predictions = model.predict(img_array)

    predicted_idx = int(np.argmax(predictions))
    confidence = float(np.max(predictions))

    probabilities = {
        cls: round(float(prob) * 100, 2)
        for cls, prob in zip(CLASS_NAMES, predictions[0])
    }

    return {
        'tumor': CLASS_NAMES[predicted_idx],
        'confidence': round(confidence * 100, 2),
        'probabilities': probabilities
    }
