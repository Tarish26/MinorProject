import numpy as np
import tensorflow as tf

# Load model
model = tf.keras.models.load_model('backend/api/model/model.h5')

# Generate random test image (should predict near 25% for each class)
random_image = np.random.rand(1, 299, 299, 3) * 255
predictions = model.predict(random_image)[0]

print("Random image predictions:")
for cls, prob in zip(['Glioma', 'Meningioma', 'Pituitary', 'No Tumor'], predictions):
    print(f"{cls}: {prob*100:.2f}%")