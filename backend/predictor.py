import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, GlobalMaxPooling2D
from tensorflow.keras.applications import VGG16

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "facetracker.h5")


def build_model() -> tf.keras.Model:
    input_layer = Input(shape=(120, 120, 3))

    # IMPORTANT: match your notebook defaults
    # In your notebook you used: VGG16(include_top=False) (no weights arg)
    # We'll explicitly set weights='imagenet' to be stable.
    vgg_features = VGG16(include_top=False, weights="imagenet")(input_layer)

    # Classification head
    f1 = GlobalMaxPooling2D()(vgg_features)
    class1 = Dense(2048, activation="relu")(f1)
    class2 = Dense(1, activation="sigmoid", name="class")(class1)

    # Bounding box head
    f2 = GlobalMaxPooling2D()(vgg_features)
    regress1 = Dense(2048, activation="relu")(f2)
    regress2 = Dense(4, activation="sigmoid", name="bbox")(regress1)

    return Model(inputs=input_layer, outputs=[class2, regress2], name="facetracker")


# Build model architecture
model = build_model()

# Load weights from the .h5 file.
# If this fails, your .h5 may contain a full SavedModel (architecture+weights),
# but in many cases Keras can still load weights this way.
model.load_weights(MODEL_PATH)


def predict(image_rgb: np.ndarray):
    """
    image_rgb: uint8 RGB image (H, W, 3)
    Returns: (score: float, bbox: [x1,y1,x2,y2] normalized 0..1)
    """
    resized = tf.image.resize(image_rgb, (120, 120))
    inp = tf.expand_dims(resized / 255.0, 0)  # (1,120,120,3)
    cls, bbox = model.predict(inp, verbose=0)
    return float(cls[0][0]), bbox[0].tolist()