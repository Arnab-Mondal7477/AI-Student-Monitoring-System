import cv2
import numpy as np
import os
from face_engine import FaceEngine

BASE_DIR = "/Users/arnab/Documents/AI-Student-Monitoring"
engine = FaceEngine(
    os.path.join(BASE_DIR, "face_detection_yunet_2026may.onnx"),
    os.path.join(BASE_DIR, "face_recognition_sface_2021dec.onnx")
)

img_front = cv2.imread(os.path.join(BASE_DIR, "student_faces/STU001/front/face_1787120547_0.jpg"))
img_left = cv2.imread(os.path.join(BASE_DIR, "student_faces/STU001/left/face_1787120550_0.jpg"))

f_front = engine.extract_feature(img_front, engine.detect_faces(img_front)[0])
f_left = engine.extract_feature(img_left, engine.detect_faces(img_left)[0])
print("Original Sim:", engine.compute_similarity(f_front, f_left))

# Test fusing
def extract_fused(img):
    face = engine.detect_faces(img)[0]
    aligned = engine.recognizer.alignCrop(img, face)
    f1 = np.asarray(engine.recognizer.feature(aligned), dtype=np.float32)
    f2 = np.asarray(engine.recognizer.feature(cv2.flip(aligned, 1)), dtype=np.float32)
    fused = f1 + f2
    fused /= np.linalg.norm(fused)
    return fused

fused_front = extract_fused(img_front)
fused_left = extract_fused(img_left)
print("Fused Sim:", engine.compute_similarity(fused_front, fused_left))

