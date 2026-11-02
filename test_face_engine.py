import os
import sys
import cv2
import numpy as np

from face_engine import FaceEngine, StudentFaceDatabase, PoseEstimator, FaceQualityAnalyzer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YUNET_MODEL = os.path.join(BASE_DIR, "face_detection_yunet_2026may.onnx")
SFACE_MODEL = os.path.join(BASE_DIR, "face_recognition_sface_2021dec.onnx")
STUDENT_FACES_DIR = os.path.join(BASE_DIR, "student_faces")

def run_tests():
    print("==================================================")
    print(" RUNNING 3D-AWARE FACE ENGINE UNIT TESTS")
    print("==================================================")

    # 1. Initialize Face Engine
    assert os.path.exists(YUNET_MODEL), f"Missing {YUNET_MODEL}"
    assert os.path.exists(SFACE_MODEL), f"Missing {SFACE_MODEL}"

    engine = FaceEngine(YUNET_MODEL, SFACE_MODEL)
    print("✓ FaceEngine initialized successfully")

    # 2. Test Pose Estimator with dummy landmarks
    estimator = PoseEstimator()
    dummy_landmarks = np.array([
        [100, 100], # Right eye
        [150, 100], # Left eye
        [125, 125], # Nose tip
        [110, 150], # Right mouth
        [140, 150]  # Left mouth
    ], dtype=np.float32)

    pose = estimator.estimate_pose(dummy_landmarks, (480, 640))
    assert "yaw" in pose and "pitch" in pose and "roll" in pose
    print(f"✓ PoseEstimator output: {pose}")

    # 3. Test Face Quality Analyzer
    quality_analyzer = FaceQualityAnalyzer()
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(dummy_img, (100, 100), (250, 250), (200, 200, 200), -1)
    quality = quality_analyzer.evaluate_quality(dummy_img, (100, 100, 150, 150), 0.95)
    assert "quality_score" in quality and "reason" in quality
    print(f"✓ FaceQualityAnalyzer output: {quality['reason']} (Score: {quality['quality_score']})")

    # 4. Test Student Database Loading
    db = StudentFaceDatabase(STUDENT_FACES_DIR, engine)
    print(f"✓ StudentFaceDatabase loaded {len(db.database)} student profile(s)")

    print("==================================================")
    print(" ALL UNIT TESTS PASSED SUCCESSFULLY! ✓")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
