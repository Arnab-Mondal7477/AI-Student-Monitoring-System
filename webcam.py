import cv2
from ultralytics import YOLO
from pathlib import Path
from datetime import datetime
import requests


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "yolo11n.pt"

API_URL = "http://127.0.0.1:8000/detections/phone"

STUDENT_ID = "STU002"

EVIDENCE_DIR = Path("evidence")
EVIDENCE_DIR.mkdir(exist_ok=True)

CONFIDENCE_THRESHOLD = 0.50


# ============================================================
# LOAD YOLO MODEL
# ============================================================

print("Loading YOLO11...")

model = YOLO(MODEL_PATH)

print("✅ YOLO11 loaded successfully")


# ============================================================
# START CAMERA
# ============================================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open camera.")
    print("Make sure Terminal has Camera permission.")
    exit()

print("🎥 Camera started")
print("Press Q to quit")


# ============================================================
# DETECTION LOOP
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:
        print("❌ Failed to read camera frame")
        break

    # Run YOLO
    results = model(frame, verbose=False)

    phone_detected = False

    for result in results:

        boxes = result.boxes

        for box in boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            # YOLO COCO class 67 = cell phone
            if class_id == 67 and confidence >= CONFIDENCE_THRESHOLD:

                phone_detected = True

                print(
                    f"📱 Phone detected "
                    f"({confidence * 100:.2f}%)"
                )

                # ------------------------------------------------
                # SAVE EVIDENCE IMAGE
                # ------------------------------------------------

                timestamp = datetime.now().strftime(
                    "%Y%m%d_%H%M%S"
                )

                evidence_filename = (
                    f"phone_{timestamp}.jpg"
                )

                evidence_path = (
                    EVIDENCE_DIR / evidence_filename
                )

                # Draw bounding box
                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"PHONE {confidence * 100:.1f}%",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

                # Save image
                cv2.imwrite(
                    str(evidence_path),
                    frame
                )

                print(
                    f"📸 Evidence saved: "
                    f"{evidence_path}"
                )


                # ------------------------------------------------
                # SEND DETECTION TO FASTAPI
                # ------------------------------------------------

                payload = {
                    "student_id": STUDENT_ID,
                    "object_name": "cell phone",
                    "confidence": confidence,
                    "evidence_path": str(evidence_path),
                }

                try:

                    response = requests.post(
                        API_URL,
                        json=payload,
                        timeout=5
                    )

                    if response.status_code in (200, 201):

                        print(
                            "✅ Detection saved to database"
                        )

                    else:

                        print(
                            "❌ API error:",
                            response.status_code
                        )

                        print(response.text)

                except requests.exceptions.RequestException as e:

                    print(
                        "❌ Could not connect to FastAPI:",
                        e
                    )

    # ========================================================
    # DISPLAY CAMERA
    # ========================================================

    cv2.imshow(
        "AI Student Monitoring - YOLO11",
        frame
    )

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()

print("🛑 Camera stopped")
print("✅ YOLO phone monitoring ended")