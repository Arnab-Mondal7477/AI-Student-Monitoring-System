import cv2
import os
import numpy as np
import time
import requests
from datetime import datetime
from ultralytics import YOLO
import argparse

from face_engine import FaceEngine, StudentFaceDatabase, TemporalVotingTracker, LivenessDetector, BehaviorAnalyzer

parser = argparse.ArgumentParser(description="Multi-Camera AI Monitoring")
parser.add_argument("--camera", type=str, default="0", help="Camera index (e.g., 0) or RTSP URL")
parser.add_argument("--location", type=str, default="Main Camera", help="Location of this camera")
args = parser.parse_args()

try:
    camera_source = int(args.camera)
except ValueError:
    camera_source = args.camera


# ============================================================
# AI STUDENT MONITORING SYSTEM
# 3D-AWARE MULTI-POSE FACE + PHONE DETECTION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# FILE PATHS
# ============================================================

YUNET_MODEL = os.path.join(BASE_DIR, "face_detection_yunet_2026may.onnx")
SFACE_MODEL = os.path.join(BASE_DIR, "face_recognition_sface_2021dec.onnx")
YOLO_MODEL = os.path.join(BASE_DIR, "yolo11n.pt")
STUDENT_FACES_DIR = os.path.join(BASE_DIR, "portal", "backend", "public", "faces")
EVIDENCE_FOLDER = os.path.join(BASE_DIR, "evidence")


# ============================================================
# CAMERA CONFIGURATION
# ============================================================

CAMERA_INDEX = 0
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720


# ============================================================
# THRESHOLDS & SETTINGS
# ============================================================

SCORE_THRESHOLD = 0.6
MATCH_THRESHOLD = 0.50
MATCH_MARGIN = 0.08
REQUIRED_RECOGNITION_FRAMES = 5
PHONE_CONFIDENCE = 0.50
PHONE_COOLDOWN = 5
NODE_BACKEND_URL = "http://127.0.0.1:5000/api/monitoring"
PYTHON_BACKEND_URL = "http://127.0.0.1:8000"


os.makedirs(EVIDENCE_FOLDER, exist_ok=True)
os.makedirs(STUDENT_FACES_DIR, exist_ok=True)


print("================================================")
print(" AI STUDENT MONITORING SYSTEM (3D-AWARE MULTI-POSE)")
print("================================================")
print("Face match threshold:", MATCH_THRESHOLD)
print("Match margin threshold:", MATCH_MARGIN)
print("Required stable recognition frames:", REQUIRED_RECOGNITION_FRAMES)
print()


for required_file in [YUNET_MODEL, SFACE_MODEL, YOLO_MODEL, STUDENT_FACES_DIR]:
    if not os.path.exists(required_file):
        print(f"ERROR: Required file/folder not found: {required_file}")
        raise SystemExit


# ============================================================
# INITIALIZE FACE & PHONE ENGINES
# ============================================================

print("Initializing 3D-Aware FaceEngine...")
face_engine = FaceEngine(
    yunet_path=YUNET_MODEL,
    sface_path=SFACE_MODEL,
    score_thresh=SCORE_THRESHOLD,
    match_thresh=MATCH_THRESHOLD,
    match_margin=MATCH_MARGIN
)

print("Fetching registered students from backend...")
registered_students = set()
try:
    resp = requests.get(f"{NODE_BACKEND_URL}/students", timeout=2)
    if resp.status_code == 200:
        for s in resp.json():
            registered_students.add(s["student_id"])
        print(f"Backend returned {len(registered_students)} registered students: {registered_students}")
    else:
        print("Backend returned non-200 status, falling back to local folders.")
except Exception as e:
    print("Could not reach backend, falling back to local folders.", e)

print("Loading Student Multi-Pose Face Database...")
student_db = StudentFaceDatabase(STUDENT_FACES_DIR, face_engine)

# Filter DB against registered students if backend was reachable
if registered_students:
    valid_db = {}
    for sid, data in student_db.database.items():
        if sid in registered_students:
            valid_db[sid] = data
        else:
            print(f"Warning: {sid} has face data but is not registered in the database. Ignored.")
    student_db.database = valid_db

voting_tracker = TemporalVotingTracker(
    required_frames=REQUIRED_RECOGNITION_FRAMES,
    grace_frames=4
)

liveness_detector = LivenessDetector(history_size=15)
behavior_analyzer = BehaviorAnalyzer()

print("Loading YOLO11 phone detector...")
yolo_model = YOLO(YOLO_MODEL)
print("All AI Engines loaded successfully.\n")

print("Total registered students:", len(student_db.database))
print()


# ============================================================
# OPEN CAMERA
# ============================================================

print("================================================")
print(" STARTING AI MONITOR")
print("================================================")
print()


camera = cv2.VideoCapture(camera_source)


if not camera.isOpened():

    print(
        "ERROR: Camera could not be opened."
    )

    raise SystemExit


# ============================================================
# CAMERA RESOLUTION
# ============================================================

camera.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    CAMERA_WIDTH
)

camera.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    CAMERA_HEIGHT
)


actual_width = int(
    camera.get(
        cv2.CAP_PROP_FRAME_WIDTH
    )
)


actual_height = int(
    camera.get(
        cv2.CAP_PROP_FRAME_HEIGHT
    )
)


print(
    f"Camera resolution: "
    f"{actual_width} x {actual_height}"
)

print()

print(
    "AI monitoring started."
)

print(
    "Press Q to quit."
)

print()


# ============================================================
# WINDOW
# ============================================================

WINDOW_NAME = (
    "AI Student Monitoring"
)


cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)


# ============================================================
# RUNTIME VARIABLES
# ============================================================

last_phone_detection = 0
last_face_detection = 0
FACE_COOLDOWN = 10

recognition_counter = 0

stable_student = None

best_student_similarity = 0.0


# ============================================================
# MAIN MONITORING LOOP
# ============================================================

try:

    while True:

        # ====================================================
        # READ CAMERA FRAME
        # ====================================================

        success, frame = camera.read()


        if not success:

            print(
                "\nCamera frame error."
            )

            continue


        # ====================================================
        # MIRROR CAMERA
        # ====================================================

        frame = cv2.flip(
            frame,
            1
        )


        # ====================================================
        # FACE RECOGNITION (3D-AWARE MULTI-POSE)
        # ====================================================

        faces = face_engine.detect_faces(frame)

        frame_best_candidate = "UNKNOWN"
        frame_best_similarity = 0.0
        frame_best_face = None

        if faces is not None and len(faces) > 0:
            for face in faces:
                analysis = face_engine.analyze_face(frame, face)
                bbox = analysis["bbox"]
                pose = analysis["pose"]
                quality = analysis["quality"]
                x, y, w, h = bbox

                features = face_engine.extract_features_tta(frame, face)
                match_info = student_db.identify_face(features, MATCH_THRESHOLD, MATCH_MARGIN)

                candidate_id = match_info["student_id"]
                similarity = match_info["similarity"]
                confirmed = match_info["confirmed"]

                # LIVENESS CHECK (ANTI-SPOOFING)
                is_real = True
                if confirmed:
                    is_real = liveness_detector.update_and_check(candidate_id, bbox, pose)

                if confirmed and is_real:
                    label = f"{candidate_id} ({pose['pose_label']})"
                    box_color = (0, 255, 0) # Green
                    if similarity > frame_best_similarity:
                        frame_best_similarity = similarity
                        frame_best_candidate = candidate_id
                        frame_best_face = face
                elif confirmed and not is_real:
                    label = "SPOOF DETECTED"
                    box_color = (255, 0, 255) # Magenta (Purple)
                elif not quality["is_valid"]:
                    label = f"Quality Low ({quality['reason']})"
                    box_color = (0, 200, 255) # Amber
                else:
                    label = "Unknown Student"
                    box_color = (0, 0, 255) # Red

                # Draw Face Bounding Box
                cv2.rectangle(frame, (x, y), (x + w, y + h), box_color, 2)

                # Face ID & Pose Label
                cv2.putText(frame, label, (x, max(30, y - 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, box_color, 2)

                # Match Similarity & Pose Telemetry
                sub_text = f"Match: {similarity:.3f} | Yaw: {pose['yaw']}deg"
                cv2.putText(frame, sub_text, (x, y + h + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, box_color, 2)

                # Behavioral AI Telemetry
                behavior = behavior_analyzer.analyze(analysis["landmarks"], pose)
                att = behavior["attention"]
                emo = behavior["emotion"]
                beh_text = f"Behavior: {att} | {emo}"
                beh_color = (0, 165, 255) if att == "Distracted" else box_color # Orange if distracted
                cv2.putText(frame, beh_text, (x, y + h + 48), cv2.FONT_HERSHEY_SIMPLEX, 0.55, beh_color, 2)

        # ========================================================
        # TEMPORAL VOTING & RECOGNITION STABILITY
        # ========================================================

        stable_student, vote_count = voting_tracker.update(frame_best_candidate)


        # ========================================================
        # DISPLAY STUDENT STATUS
        # ========================================================

        if stable_student is not None:

            student_text = (
                f"Student: "
                f"{stable_student}"
            )

            student_color = (
                0,
                255,
                0
            )

        else:

            student_text = (
                "Student: Unknown"
            )

            student_color = (
                0,
                0,
                255
            )


        # ========================================================
        # YOLO PHONE DETECTION
        # ========================================================

        phone_detected = False

        phone_confidence = 0.0

        phone_box = None


        results = yolo_model(
            frame,
            verbose=False
        )


        for result in results:

            if result.boxes is None:

                continue


            for box in result.boxes:

                class_id = int(
                    box.cls[0]
                )


                confidence = float(
                    box.conf[0]
                )


                class_name = (
                    yolo_model.names[
                        class_id
                    ]
                )


                # =================================================
                # CHECK PHONE CLASS
                # =================================================

                if (
                    class_name.lower()
                    in [
                        "cell phone",
                        "mobile phone",
                        "phone"
                    ]
                    and
                    confidence
                    >=
                    PHONE_CONFIDENCE
                ):

                    if (
                        confidence
                        >
                        phone_confidence
                    ):

                        phone_detected = True

                        phone_confidence = (
                            confidence
                        )


                        coordinates = (
                            box.xyxy[0]
                            .cpu()
                            .numpy()
                            .astype(int)
                        )


                        phone_box = (
                            coordinates
                        )


        # ========================================================
        # DRAW PHONE
        # ========================================================

        if (
            phone_detected
            and
            phone_box is not None
        ):

            px1, py1, px2, py2 = (
                phone_box
            )


            cv2.rectangle(
                frame,
                (
                    px1,
                    py1
                ),
                (
                    px2,
                    py2
                ),
                (
                    0,
                    165,
                    255
                ),
                3
            )


            cv2.putText(
                frame,
                (
                    f"PHONE "
                    f"{phone_confidence * 100:.1f}%"
                ),
                (
                    px1,
                    max(
                        30,
                        py1 - 10
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (
                    0,
                    165,
                    255
                ),
                2
            )


        # ========================================================
        # RECORD PHONE VIOLATION
        # ========================================================

        current_time = time.time()


        # Determine target person
        if (
            stable_student is not None
            and frame_best_candidate == stable_student
            and frame_best_similarity >= MATCH_THRESHOLD
        ):
            target_student = stable_student
            person_type = "REGISTERED"
        else:
            target_student = "UNKNOWN"
            person_type = "UNREGISTERED VISITOR"

        # 1. PHONE VIOLATION RECORDING
        if (
            phone_detected
            and current_time - last_phone_detection >= PHONE_COOLDOWN
        ):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            evidence_filename = f"phone_{target_student}_{timestamp}.jpg"
            evidence_path = os.path.join(EVIDENCE_FOLDER, evidence_filename)
            saved = cv2.imwrite(evidence_path, frame)

            print("\n============================================")
            print(f"📱 PHONE VIOLATION DETECTED ({person_type})")
            print("Person / ID:", target_student)
            print("Phone confidence:", f"{phone_confidence:.3f}")
            print("Evidence:", evidence_path)
            print("============================================")

            payload = {
                "student_id": target_student,
                "object_name": "cell phone",
                "detection_type": "PHONE_VIOLATION",
                "location": args.location,
                "confidence": phone_confidence,
                "evidence_path": evidence_path,
                "alert_sent": False
            }
            try:
                # 1. Post to Node.js Backend (College Portal)
                requests.post(f"{NODE_BACKEND_URL}/detections", json=payload, timeout=2)
            except Exception as error:
                print("Node Backend error:", error)
                
            try:
                # 2. Post to Python Backend (Security Dashboard)
                requests.post(f"{PYTHON_BACKEND_URL}/phone-detections", json=payload, timeout=2)
            except Exception as error:
                print("Python Backend error:", error)


            last_phone_detection = current_time

        # 2. FACE PRESENCE / CHECK-IN LOGGING (No phone needed)
        elif (
            faces is not None
            and len(faces) > 0
            and not phone_detected
            and current_time - last_face_detection >= FACE_COOLDOWN
        ):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            evidence_filename = f"face_{target_student}_{timestamp}.jpg"
            evidence_path = os.path.join(EVIDENCE_FOLDER, evidence_filename)
            saved = cv2.imwrite(evidence_path, frame)

            conf_val = float(frame_best_similarity) if target_student != "UNKNOWN" else 0.85

            print("\n============================================")
            print(f"👁️ FACE ENTRY LOGGED ({person_type})")
            print("Person / ID:", target_student)
            print("Match Score:", f"{conf_val:.3f}")
            print("Evidence:", evidence_path)
            print("============================================")

            payload = {
                "student_id": target_student,
                "object_name": "face presence",
                "detection_type": "FACE_PRESENCE",
                "location": args.location,
                "confidence": conf_val,
                "evidence_path": evidence_path,
                "alert_sent": False
            }
            try:
                # 1. Post to Node.js Backend (College Portal)
                requests.post(f"{NODE_BACKEND_URL}/detections", json=payload, timeout=2)
            except Exception as error:
                print("Node Backend error:", error)
                
            try:
                # 2. Post to Python Backend (Security Dashboard)
                requests.post(f"{PYTHON_BACKEND_URL}/phone-detections", json=payload, timeout=2)
            except Exception as error:
                print("Python Backend error:", error)

            last_face_detection = current_time


        # ========================================================
        # TOP TITLE
        # ========================================================

        cv2.putText(
            frame,
            "AI STUDENT MONITORING",
            (
                30,
                40
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (
                255,
                255,
                255
            ),
            2
        )


        # ========================================================
        # STUDENT STATUS
        # ========================================================

        cv2.putText(
            frame,
            student_text,
            (
                30,
                80
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            student_color,
            2
        )


        # ========================================================
        # PHONE STATUS
        # ========================================================

        if phone_detected:

            phone_text = (
                f"Phone: DETECTED "
                f"({phone_confidence * 100:.1f}%)"
            )

            phone_color = (
                0,
                165,
                255
            )

        else:

            phone_text = (
                "Phone: Not detected"
            )

            phone_color = (
                255,
                255,
                255
            )


        cv2.putText(
            frame,
            phone_text,
            (
                30,
                120
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            phone_color,
            2
        )


        # ========================================================
        # RECOGNITION PROGRESS
        # ========================================================

        recognition_text = (
            f"Recognition: "
            f"{recognition_counter}/"
            f"{REQUIRED_RECOGNITION_FRAMES}"
        )


        cv2.putText(
            frame,
            recognition_text,
            (
                30,
                155
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (
                255,
                255,
                255
            ),
            2
        )


        # ========================================================
        # MATCH STATUS
        # ========================================================

        match_text = (
            f"Best face match: "
            f"{frame_best_similarity:.3f}"
        )


        cv2.putText(
            frame,
            match_text,
            (
                30,
                190
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (
                255,
                255,
                255
            ),
            2
        )


        # ========================================================
        # QUIT MESSAGE
        # ========================================================

        cv2.putText(
            frame,
            "Press Q to quit",
            (
                30,
                frame.shape[0] - 20
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (
                255,
                255,
                255
            ),
            2
        )


        # ========================================================
        # DISPLAY WINDOW
        # ========================================================

        cv2.imshow(
            WINDOW_NAME,
            frame
        )


        # ========================================================
        # KEYBOARD
        # ========================================================

        key = (
            cv2.waitKey(10)
            &
            0xFF
        )


        if key == ord("q"):

            print()

            print(
                "Q pressed."
            )

            break


# ============================================================
# CLEANUP
# ============================================================

finally:

    camera.release()

    cv2.destroyAllWindows()

    for _ in range(3):

        cv2.waitKey(1)


    print()

    print(
        "AI monitoring stopped."
    )

    print(
        "Program finished."
    )
