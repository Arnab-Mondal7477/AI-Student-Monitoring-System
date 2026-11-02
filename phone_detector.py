import os
import requests
from datetime import datetime
from ultralytics import YOLO


# =========================
# CONFIGURATION
# =========================

MODEL_PATH = "yolo11n.pt"
API_URL = "http://127.0.0.1:8000/detections/phone"

# COCO class ID for cell phone
CELL_PHONE_CLASS_ID = 67

CONFIDENCE_THRESHOLD = 0.50

EVIDENCE_DIR = "evidence"


# =========================
# SETUP
# =========================

os.makedirs(EVIDENCE_DIR, exist_ok=True)

model = YOLO(MODEL_PATH)


# =========================
# PHONE DETECTION FUNCTION
# =========================

def process_frame(frame, save_evidence=True):

    results = model(
        frame,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False
    )

    phone_detected = False

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id == CELL_PHONE_CLASS_ID:

                phone_detected = True

                print(
                    f"📱 Mobile phone detected "
                    f"(confidence: {confidence:.2%})"
                )

                evidence_path = None

                # =========================
                # SAVE EVIDENCE
                # =========================

                if save_evidence:

                    timestamp = datetime.now().strftime(
                        "%Y%m%d_%H%M%S"
                    )

                    filename = (
                        f"phone_{timestamp}.jpg"
                    )

                    evidence_path = os.path.join(
                        EVIDENCE_DIR,
                        filename
                    )

                    result.save(
                        filename=evidence_path
                    )

                    print(
                        f"📸 Evidence saved: "
                        f"{evidence_path}"
                    )

                # =========================
                # SEND TO FASTAPI
                # =========================

                payload = {
                    "student_id": None,
                    "object_name": "cell phone",
                    "confidence": confidence,
                    "evidence_path": evidence_path,
                    "alert_sent": True
                }

                try:

                    response = requests.post(
                        API_URL,
                        json=payload,
                        timeout=5
                    )

                    if response.status_code == 200:

                        print(
                            "✅ Detection saved "
                            "to database"
                        )

                    else:

                        print(
                            f"❌ API error: "
                            f"{response.status_code}"
                        )

                except requests.RequestException as error:

                    print(
                        f"❌ Could not connect "
                        f"to FastAPI: {error}"
                    )

    return phone_detected