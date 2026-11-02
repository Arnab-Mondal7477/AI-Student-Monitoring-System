import cv2
import os
import sys
import requests
from datetime import datetime


# ============================================================
# AI STUDENT FACE ENROLLMENT
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

YUNET_MODEL = os.path.join(
    BASE_DIR,
    "face_detection_yunet_2026may.onnx"
)

STUDENT_FACES_DIR = os.path.join(
    BASE_DIR,
    "student_faces"
)

BACKEND_URL = "http://127.0.0.1:8000"

CAMERA_INDEX = 0

IMAGE_COUNT = 20

SCORE_THRESHOLD = 0.6
NMS_THRESHOLD = 0.3
TOP_K = 5000


# ============================================================
# CHECK MODEL
# ============================================================

if not os.path.exists(YUNET_MODEL):

    print("ERROR: YuNet model not found:")
    print(YUNET_MODEL)
    sys.exit(1)


# ============================================================
# LOAD YUNET
# ============================================================

print()
print("================================================")
print(" AI STUDENT FACE ENROLLMENT")
print("================================================")
print()

print("Loading YuNet face detector...")

face_detector = cv2.FaceDetectorYN.create(
    YUNET_MODEL,
    "",
    (320, 320),
    SCORE_THRESHOLD,
    NMS_THRESHOLD,
    TOP_K
)

print("YuNet loaded successfully.")
print()


# ============================================================
# STUDENT INFORMATION
# ============================================================

student_id = input(
    "Enter Student ID: "
).strip()

name = input(
    "Enter Student Name: "
).strip()

email = input(
    "Enter Student Email: "
).strip()


if not student_id:
    print("ERROR: Student ID cannot be empty.")
    sys.exit(1)

if not name:
    print("ERROR: Student name cannot be empty.")
    sys.exit(1)

if not email:
    print("ERROR: Email cannot be empty.")
    sys.exit(1)


# ============================================================
# STUDENT FOLDER
# ============================================================

student_folder = os.path.join(
    STUDENT_FACES_DIR,
    student_id
)


if os.path.exists(student_folder):

    existing_images = [
        f for f in os.listdir(student_folder)
        if f.lower().endswith(
            (".jpg", ".jpeg", ".png")
        )
    ]

    if existing_images:

        print()
        print(
            f"WARNING: {student_id} already has "
            f"{len(existing_images)} face image(s)."
        )

        choice = input(
            "Continue and add more images? (y/n): "
        ).strip().lower()

        if choice != "y":
            print("Enrollment cancelled.")
            sys.exit(0)

else:

    os.makedirs(
        student_folder,
        exist_ok=True
    )


# ============================================================
# REGISTER STUDENT IN BACKEND
# ============================================================

print()
print("Registering student in database...")

try:

    response = requests.post(
        f"{BACKEND_URL}/students",

        json={
            "student_id": student_id,
            "name": name,
            "email": email
        },

        timeout=5
    )


    if response.status_code == 200:

        print(
            "Student registered successfully."
        )

    elif response.status_code == 400:

        print(
            "Student already exists in database."
        )

        print(
            "We will continue with face enrollment."
        )

    else:

        print(
            "Backend returned:",
            response.status_code
        )

        print(
            response.text
        )


except Exception as error:

    print()
    print(
        "WARNING: Could not connect to backend."
    )

    print(error)

    print()
    print(
        "Face images can still be captured."
    )


# ============================================================
# OPEN CAMERA
# ============================================================

print()
print("Opening camera...")

camera = cv2.VideoCapture(
    CAMERA_INDEX
)


if not camera.isOpened():

    print(
        "ERROR: Camera could not be opened."
    )

    sys.exit(1)


camera.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

camera.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)


WINDOW_NAME = "Student Face Enrollment"

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)


# ============================================================
# ENROLLMENT VARIABLES
# ============================================================

captured_count = 0

last_capture_time = 0

capture_interval = 0.25


print()
print("================================================")
print(" FACE CAPTURE STARTED")
print("================================================")
print()
print(
    f"Student: {student_id}"
)
print(
    f"Name: {name}"
)
print()
print(
    f"Target images: {IMAGE_COUNT}"
)
print()
print(
    "Look at the camera."
)
print(
    "Move your face slightly between captures."
)
print()
print(
    "Press Q to cancel."
)
print()


# ============================================================
# FACE DETECTION FUNCTION
# ============================================================

def detect_faces(image):

    height, width = image.shape[:2]

    face_detector.setInputSize(
        (width, height)
    )

    result = face_detector.detect(
        image
    )

    if result is None:
        return None

    _, faces = result

    return faces


# ============================================================
# CAMERA LOOP
# ============================================================

try:

    while captured_count < IMAGE_COUNT:

        success, frame = camera.read()

        if not success:

            print(
                "Camera frame error."
            )

            continue


        # ----------------------------------------------------
        # MIRROR CAMERA
        # ----------------------------------------------------

        frame = cv2.flip(
            frame,
            1
        )


        # ----------------------------------------------------
        # DETECT FACE
        # ----------------------------------------------------

        faces = detect_faces(
            frame
        )


        face_found = False


        if (
            faces is not None
            and
            len(faces) > 0
        ):

            face_found = True

            # Use strongest face

            best_face = max(
                faces,
                key=lambda face: float(
                    face[-1]
                )
            )


            x = int(
                best_face[0]
            )

            y = int(
                best_face[1]
            )

            w = int(
                best_face[2]
            )

            h = int(
                best_face[3]
            )


            confidence = float(
                best_face[-1]
            )


            # ------------------------------------------------
            # DRAW FACE BOX
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (
                    x,
                    y
                ),
                (
                    x + w,
                    y + h
                ),
                (
                    0,
                    255,
                    0
                ),
                3
            )


            cv2.putText(
                frame,
                f"Face {confidence:.2f}",
                (
                    x,
                    max(
                        30,
                        y - 10
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (
                    0,
                    255,
                    0
                ),
                2
            )


            # ------------------------------------------------
            # AUTO CAPTURE
            # ------------------------------------------------

            current_time = (
                cv2.getTickCount()
                /
                cv2.getTickFrequency()
            )


            if (
                current_time
                -
                last_capture_time
                >=
                capture_interval
            ):

                timestamp = datetime.now().strftime(
                    "%Y%m%d_%H%M%S_%f"
                )


                filename = (
                    f"face_"
                    f"{captured_count + 1:03d}_"
                    f"{timestamp}.jpg"
                )


                filepath = os.path.join(
                    student_folder,
                    filename
                )


                saved = cv2.imwrite(
                    filepath,
                    frame
                )


                if saved:

                    captured_count += 1

                    last_capture_time = (
                        current_time
                    )

                    print(
                        f"\rCaptured: "
                        f"{captured_count}/"
                        f"{IMAGE_COUNT}",
                        end="",
                        flush=True
                    )


        # ----------------------------------------------------
        # DISPLAY STATUS
        # ----------------------------------------------------

        status_text = (
            f"Captured: "
            f"{captured_count}/"
            f"{IMAGE_COUNT}"
        )


        cv2.putText(
            frame,
            status_text,
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


        cv2.putText(
            frame,
            f"Student: {student_id}",
            (
                30,
                80
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (
                255,
                255,
                255
            ),
            2
        )


        if face_found:

            instruction = (
                "Face detected - keep looking"
            )

        else:

            instruction = (
                "No face detected"
            )


        cv2.putText(
            frame,
            instruction,
            (
                30,
                120
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


        cv2.putText(
            frame,
            "Press Q to cancel",
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


        cv2.imshow(
            WINDOW_NAME,
            frame
        )


        key = (
            cv2.waitKey(10)
            &
            0xFF
        )


        if key == ord("q"):

            print()
            print()
            print(
                "Enrollment cancelled."
            )

            break


finally:

    camera.release()

    cv2.destroyAllWindows()

    for _ in range(3):

        cv2.waitKey(1)


# ============================================================
# FINAL RESULT
# ============================================================

print()
print()
print("================================================")
print(" ENROLLMENT RESULT")
print("================================================")

print(
    "Student ID:",
    student_id
)

print(
    "Name:",
    name
)

print(
    "Images captured:",
    captured_count
)

print(
    "Face folder:",
    student_folder
)

print()

if captured_count >= IMAGE_COUNT:

    print(
        "✅ Face enrollment completed successfully."
    )

    print()
    print(
        "The student is now ready for AI face recognition."
    )

else:

    print(
        "⚠️ Enrollment was not completed."
    )

print()
print("================================================")
