import os
import cv2
import numpy as np
import math
from typing import List, Dict, Tuple, Optional, Any


# ============================================================
# 3D-AWARE MULTI-POSE FACE RECOGNITION ENGINE
# ============================================================

class PoseEstimator:
    """
    Estimates 3D Head Pose Angles (Yaw, Pitch, Roll) in degrees
    using 5 facial landmarks from YuNet (eyes, nose, mouth corners).
    """
    def estimate_pose(self, landmarks_2d: np.ndarray, image_size: Tuple[int, int]) -> Dict[str, float]:
        """
        landmarks_2d: shape (5, 2) -> [[x_re, y_re], [x_le, y_le], [x_nt, y_nt], [x_rc, y_rc], [x_lc, y_lc]]
        """
        r_eye = landmarks_2d[0]
        l_eye = landmarks_2d[1]
        nose = landmarks_2d[2]
        r_mouth = landmarks_2d[3]
        l_mouth = landmarks_2d[4]

        # Eye midpoint
        eye_mid = (r_eye + l_eye) / 2.0
        eye_dist = np.linalg.norm(l_eye - r_eye)
        if eye_dist < 1e-5:
            return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "pose_label": "Frontal"}

        # Roll: Tilt angle of line connecting eyes
        dx = l_eye[0] - r_eye[0]
        dy = l_eye[1] - r_eye[1]
        roll = math.degrees(math.atan2(dy, dx))

        # Yaw: Horizontal offset of nose tip relative to eye midpoint normalized by eye distance
        # Standard frontal ratio: nose.x is at eye_mid.x
        yaw_ratio = (nose[0] - eye_mid[0]) / eye_dist
        # Scale ratio to approximate degrees (-45° to +45°)
        yaw = float(np.clip(yaw_ratio * 75.0, -60.0, 60.0))

        # Pitch: Vertical offset of nose tip relative to eye midpoint vs mouth midpoint
        mouth_mid = (r_mouth + l_mouth) / 2.0
        face_height = np.linalg.norm(mouth_mid - eye_mid)
        if face_height > 1e-5:
            pitch_ratio = (nose[1] - (eye_mid[1] + face_height * 0.45)) / face_height
            pitch = float(np.clip(pitch_ratio * 60.0, -45.0, 45.0))
        else:
            pitch = 0.0

        # Classify pose label
        if yaw < -15.0:
            pose_label = "Slight Left" if yaw >= -30.0 else "Left Profile"
        elif yaw > 15.0:
            pose_label = "Slight Right" if yaw <= 30.0 else "Right Profile"
        elif pitch > 12.0:
            pose_label = "Slight Down"
        elif pitch < -12.0:
            pose_label = "Slight Up"
        else:
            pose_label = "Frontal"

        return {
            "yaw": round(yaw, 1),
            "pitch": round(pitch, 1),
            "roll": round(roll, 1),
            "pose_label": pose_label
        }


class FaceQualityAnalyzer:
    """
    Evaluates face image quality based on size, sharpness (blur), brightness, and confidence.
    """
    def evaluate_quality(self, image: np.ndarray, face_bbox: Tuple[int, int, int, int], confidence: float) -> Dict[str, Any]:
        x, y, w, h = face_bbox
        img_h, img_w = image.shape[:2]

        # 1. Face size check
        face_area = w * h
        min_dim = min(w, h)

        # 2. Crop face for blur and brightness
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(img_w, x + w), min(img_h, y + h)

        if x2 <= x1 or y2 <= y1:
            return {"is_valid": False, "quality_score": 0.0, "reason": "Face Out of Bounds"}

        face_crop = image[y1:y2, x1:x2]
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

        # Laplacian variance for blur (higher is sharper)
        blur_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Mean brightness
        brightness = np.mean(gray)

        # Determine quality status
        reasons = []
        if min_dim < 50:
            reasons.append("Face Too Small (Move Closer)")
        if blur_var < 35.0:
            reasons.append("Image Blurry")
        if brightness < 35:
            reasons.append("Too Dark")
        elif brightness > 225:
            reasons.append("Overexposed")
        if confidence < 0.60:
            reasons.append("Low Detection Confidence")

        # Normalize score (0.0 to 1.0)
        size_factor = min(1.0, min_dim / 150.0)
        blur_factor = min(1.0, blur_var / 120.0)
        bright_factor = 1.0 if 50 <= brightness <= 200 else 0.6
        conf_factor = min(1.0, confidence)

        quality_score = round(0.3 * size_factor + 0.3 * blur_factor + 0.2 * bright_factor + 0.2 * conf_factor, 2)
        is_valid = len(reasons) == 0

        return {
            "is_valid": is_valid,
            "quality_score": quality_score,
            "blur_var": round(blur_var, 1),
            "brightness": round(brightness, 1),
            "reasons": reasons,
            "reason": reasons[0] if reasons else "GOOD QUALITY"
        }


class FaceEngine:
    """
    Main 3D-Aware Face Detector & Multi-Embedding Recognizer.
    Wrapper around YuNet & SFace models with landmark alignment and multi-view matching.
    """
    def __init__(self, yunet_path: str, sface_path: str, score_thresh: float = 0.6, match_thresh: float = 0.50, match_margin: float = 0.08):
        self.yunet_path = yunet_path
        self.sface_path = sface_path
        self.match_thresh = match_thresh
        self.match_margin = match_margin

        self.detector = cv2.FaceDetectorYN.create(
            yunet_path, "", (320, 320), score_thresh, 0.3, 5000
        )
        self.recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
        self.pose_estimator = PoseEstimator()
        self.quality_analyzer = FaceQualityAnalyzer()

    def detect_faces(self, image: np.ndarray) -> Optional[np.ndarray]:
        h, w = image.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(image)
        return faces

    def extract_feature(self, image: np.ndarray, face: np.ndarray) -> Optional[np.ndarray]:
        try:
            aligned_face = self.recognizer.alignCrop(image, face)
            feature = self.recognizer.feature(aligned_face)
            return np.asarray(feature, dtype=np.float32)
        except Exception:
            return None

    def extract_features_tta(self, image: np.ndarray, face: np.ndarray) -> List[np.ndarray]:
        """
        Extracts both the original and horizontally flipped (mirrored) feature for Test-Time Augmentation (TTA).
        """
        try:
            aligned_face = self.recognizer.alignCrop(image, face)
            feature = self.recognizer.feature(aligned_face)
            
            aligned_face_flip = cv2.flip(aligned_face, 1)
            feature_flip = self.recognizer.feature(aligned_face_flip)
            
            return [np.asarray(feature, dtype=np.float32), np.asarray(feature_flip, dtype=np.float32)]
        except Exception:
            return []

    def analyze_face(self, image: np.ndarray, face: np.ndarray) -> Dict[str, Any]:
        """
        Parses face array [x, y, w, h, x_re, y_re, ..., score], computes pose and quality.
        """
        bbox = (int(face[0]), int(face[1]), int(face[2]), int(face[3]))
        confidence = float(face[-1])

        # Extract 5 landmarks
        landmarks = np.array([
            [face[4], face[5]],   # Right eye
            [face[6], face[7]],   # Left eye
            [face[8], face[9]],   # Nose tip
            [face[10], face[11]], # Right mouth
            [face[12], face[13]]  # Left mouth
        ], dtype=np.float32)

        pose = self.pose_estimator.estimate_pose(landmarks, (image.shape[0], image.shape[1]))
        quality = self.quality_analyzer.evaluate_quality(image, bbox, confidence)

        return {
            "bbox": bbox,
            "confidence": confidence,
            "landmarks": landmarks,
            "pose": pose,
            "quality": quality
        }

    def compute_similarity(self, feature1: np.ndarray, feature2: np.ndarray) -> float:
        return float(self.recognizer.match(feature1, feature2, cv2.FaceRecognizerSF_FR_COSINE))


class StudentFaceDatabase:
    """
    Loads multi-pose student face images and maintains multi-embedding profiles.
    Supports backward compatibility for flat student folders.
    """
    def __init__(self, faces_dir: str, face_engine: FaceEngine):
        self.faces_dir = faces_dir
        self.engine = face_engine
        self.database: Dict[str, Dict[str, Any]] = {}
        self.reload_database()

    def reload_database(self):
        self.database.clear()
        if not os.path.exists(self.faces_dir):
            return

        student_images = {}

        # 1. Collect images from flat directory (portal uploads format: STUxxx_timestamp.jpg)
        for f in os.listdir(self.faces_dir):
            f_path = os.path.join(self.faces_dir, f)
            if os.path.isfile(f_path) and f.lower().endswith((".jpg", ".jpeg", ".png")):
                base_name = os.path.splitext(f)[0]
                # Assuming format STU001_1787929831997
                parts = base_name.split("_")
                student_id = parts[0]
                if student_id not in student_images:
                    student_images[student_id] = []
                student_images[student_id].append((f_path, "general"))

        # 2. Collect images from student folders (old format)
        student_folders = sorted(os.listdir(self.faces_dir))
        for student_id in student_folders:
            student_path = os.path.join(self.faces_dir, student_id)
            if not os.path.isdir(student_path):
                continue
                
            if student_id not in student_images:
                student_images[student_id] = []

            # Collect image files recursively (supporting subfolders front/, left/, right/, up/, down/)
            for root, _, files in os.walk(student_path):
                rel_dir = os.path.relpath(root, student_path).lower()
                pose_tag = rel_dir if rel_dir != "." else "general"
                for f in sorted(files):
                    if f.lower().endswith((".jpg", ".jpeg", ".png")):
                        student_images[student_id].append((os.path.join(root, f), pose_tag))

        for student_id, image_entries in student_images.items():
            if not image_entries:
                continue

            embeddings = []
            pose_map = {"front": 0, "left": 0, "right": 0, "up": 0, "down": 0, "general": 0}

            for img_path, pose_tag in image_entries:
                img = cv2.imread(img_path)
                if img is None:
                    continue
                faces = self.engine.detect_faces(img)
                if faces is None or len(faces) == 0:
                    continue

                best_face = max(faces, key=lambda f: float(f[-1]))
                features = self.engine.extract_features_tta(img, best_face)
                if features:
                    embeddings.extend(features)
                    if pose_tag in pose_map:
                        pose_map[pose_tag] += 1
                    else:
                        pose_map["general"] += 1

            if embeddings:
                total_views = len(embeddings)
                pose_count = sum(1 for k, v in pose_map.items() if k != "general" and v > 0)
                if pose_count >= 4 or total_views >= 5:
                    status = "EXCELLENT"
                    completeness = 100
                elif total_views >= 3:
                    status = "GOOD"
                    completeness = 70
                else:
                    status = "INCOMPLETE"
                    completeness = 35 if total_views > 1 else 20

                self.database[student_id] = {
                    "embeddings": embeddings,
                    "total_views": total_views,
                    "pose_map": pose_map,
                    "status": status,
                    "completeness": completeness
                }
                print(f"[FACE DB] Loaded {student_id}: {total_views} view(s), Profile: {status} ({completeness}%)")

    def identify_face(self, live_features: Any, match_threshold: float = 0.50, margin_threshold: float = 0.08) -> Dict[str, Any]:
        """
        Compares live feature(s) against all multi-pose embeddings for each student.
        Uses max cosine similarity score and top-1 vs top-2 margin decision.
        Accepts a single feature or a list of features for TTA.
        """
        if not self.database or live_features is None:
            return {"student_id": "UNKNOWN", "similarity": 0.0, "second_best": 0.0, "margin": 0.0, "confirmed": False}

        if isinstance(live_features, np.ndarray):
            live_features = [live_features]

        if len(live_features) == 0:
            return {"student_id": "UNKNOWN", "similarity": 0.0, "second_best": 0.0, "margin": 0.0, "confirmed": False}

        student_scores = []
        for student_id, profile in self.database.items():
            best_sim = max(
                self.engine.compute_similarity(live_feat, ref_emb)
                for ref_emb in profile["embeddings"]
                for live_feat in live_features
            )
            student_scores.append((student_id, best_sim))

        student_scores.sort(key=lambda x: x[1], reverse=True)
        top1_id, top1_sim = student_scores[0]
        top2_sim = student_scores[1][1] if len(student_scores) > 1 else 0.0
        margin = top1_sim - top2_sim

        # Security check: must pass match_threshold AND (margin_threshold OR single student in DB)
        confirmed = (top1_sim >= match_threshold) and (margin >= margin_threshold or len(student_scores) == 1)
        final_id = top1_id if confirmed else "UNKNOWN"

        return {
            "student_id": final_id,
            "candidate_id": top1_id,
            "similarity": round(top1_sim, 3),
            "second_best": round(top2_sim, 3),
            "margin": round(margin, 3),
            "confirmed": confirmed
        }


class TemporalVotingTracker:
    """
    Smooths recognition predictions across consecutive frames.
    Provides voting buffer and a grace period during sudden movement.
    """
    def __init__(self, required_frames: int = 5, grace_frames: int = 4):
        self.required_frames = required_frames
        self.grace_frames = grace_frames
        self.history: List[str] = []
        self.last_confirmed: str = "UNKNOWN"
        self.grace_counter: int = 0

    def update(self, current_prediction: str) -> Tuple[str, int]:
        self.history.append(current_prediction)
        if len(self.history) > self.required_frames:
            self.history.pop(0)

        # Count occurrences in recent window
        counts = {}
        for s_id in self.history:
            counts[s_id] = counts.get(s_id, 0) + 1

        top_id, top_count = max(counts.items(), key=lambda x: x[1])

        if top_id != "UNKNOWN" and top_count >= 3:
            self.last_confirmed = top_id
            self.grace_counter = self.grace_frames
            return top_id, top_count
        elif self.grace_counter > 0 and self.last_confirmed != "UNKNOWN":
            self.grace_counter -= 1
            return self.last_confirmed, top_count
        else:
            self.last_confirmed = "UNKNOWN"
            return "UNKNOWN", top_count


class LivenessDetector:
    """
    3D Temporal Liveness Engine to detect Presentation Attacks (Spoofing).
    Analyzes micro-movements of bounding boxes and variance in 3D natural head pose
    over a sequence of frames.
    """
    def __init__(self, history_size: int = 15):
        self.history_size = history_size
        self.face_history: Dict[str, List[Dict[str, float]]] = {}

    def update_and_check(self, face_id: str, bbox: Tuple[int, int, int, int], pose: Dict[str, float]) -> bool:
        """
        Returns True if the face is considered REAL, False if SPOOF.
        We track the history by the recognized 'face_id'.
        """
        if face_id == "UNKNOWN":
            return True # Don't block unverified people here, let recognition handle it

        if face_id not in self.face_history:
            self.face_history[face_id] = []
            
        history = self.face_history[face_id]
        
        state = {
            "x": float(bbox[0] + bbox[2]/2), # Center X
            "y": float(bbox[1] + bbox[3]/2), # Center Y
            "yaw": pose["yaw"],
            "pitch": pose["pitch"],
            "roll": pose["roll"]
        }
        
        history.append(state)
        
        if len(history) > self.history_size:
            history.pop(0)
            
        # Wait until we have enough history to make a judgment
        if len(history) < 5:
            return True
            
        # Calculate variance in 3D pose (Yaw & Pitch)
        yaw_vals = [s["yaw"] for s in history]
        pitch_vals = [s["pitch"] for s in history]
        
        yaw_var = np.var(yaw_vals)
        pitch_var = np.var(pitch_vals)
        
        pose_variance_sum = yaw_var + pitch_var
        
        # SPOOF LOGIC:
        # A static photo (even if moved by hand) has near 0 variance in its intrinsic 3D head pose.
        # A real human naturally has micro-variations > 0.05 even when standing still.
        if pose_variance_sum < 0.05 and len(history) >= 10:
            return False # Spoof detected (Too rigid)
            
        return True # Real human


class BehaviorAnalyzer:
    """
    Analyzes geometric landmarks and 3D pose to infer Attention (Focused vs Distracted) 
    and Emotion (Neutral vs Happy).
    """
    def analyze(self, landmarks_2d: np.ndarray, pose: Dict[str, float]) -> Dict[str, str]:
        # Attention Logic
        yaw = abs(pose.get("yaw", 0))
        pitch = abs(pose.get("pitch", 0))
        
        if yaw > 20.0 or pitch > 20.0:
            attention = "Distracted"
        else:
            attention = "Focused"
            
        # Emotion (Smile) Logic
        # YuNet landmarks: 0=R_eye, 1=L_eye, 2=Nose, 3=R_mouth, 4=L_mouth
        r_eye = landmarks_2d[0]
        l_eye = landmarks_2d[1]
        r_mouth = landmarks_2d[3]
        l_mouth = landmarks_2d[4]
        
        eye_dist = np.linalg.norm(l_eye - r_eye)
        mouth_dist = np.linalg.norm(l_mouth - r_mouth)
        
        # Smile ratio: mouth width relative to eye distance
        # Typical neutral mouth is about 0.8x to 1.1x eye distance. Smiling stretches it.
        emotion = "Neutral"
        if eye_dist > 1e-5:
            ratio = mouth_dist / eye_dist
            if ratio > 1.15: # Lowered threshold slightly for better detection
                emotion = "Happy"
                
        return {
            "attention": attention,
            "emotion": emotion
        }
