import cv2
import os
import numpy as np
import time

# ============================================================
# AI STUDENT MONITORING
# FACE RECOGNITION
# OpenCV 5 + YuNet + SFace
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

YUNET_MODEL = os.path.join(
    BASE_DIR,
    "face_detection_yunet_2026may.onnx"
)

SFACE_MODEL = os.path.join(
    BASE_DIR,
    "face_recognition_sface_2021dec.onnx"
)

FACE_FOLDER = os.path.join(
    BASE_DIR,
    "portal",
    "backend",
    "public",
    "faces"
)

STUDENT_ID = "STU002"

CAMERA_INDEX = 0

# ============================================================
# SETTINGS
# ============================================================

SCORE_THRESHOLD = 0.6
NMS_THRESHOLD = 0.3
TOP_K = 5000

# Keep this for the first test.
MATCH_THRESHOLD = 0.363

CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

print("==============================================")
print(" AI STUDENT FACE RECOGNITION")
print("==============================================")
print()

if not os.path.exists(YUNET_MODEL):
    print("ERROR: YuNet model not found:")
    print(YUNET_MODEL)
    raise SystemExit

if not os.path.exists(SFACE_MODEL):
    print("ERROR: SFace model not found:")
    print(SFACE_MODEL)
    raise SystemExit

if not os.path.exists(FACE_FOLDER):
    print("ERROR: Student face folder not found:")
    print(FACE_FOLDER)
    raise SystemExit

print("Student ID:", STUDENT_ID)
print("Face folder:", FACE_FOLDER)
print()


# ============================================================
# LOAD YUNET
# ============================================================

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
# LOAD SFACE
# ============================================================

print("Loading SFace face recognition model...")

face_recognizer = cv2.FaceRecognizerSF.create(
    SFACE_MODEL,
    ""
)

print("SFace loaded successfully.")
print()


# ============================================================
# FACE DETECTION FUNCTION
# ============================================================

def detect_faces(image):
    """
    Detect faces using YuNet.

    IMPORTANT:
    OpenCV 5 requires setInputSize() to match
    the current image dimensions before detect().
    """

    height, width = image.shape[:2]

    # IMPORTANT FIX
    face_detector.setInputSize(
        (width, height)
    )

    result = face_detector.detect(image)

    if result is None:
        return None

    _, faces = result

    return faces


# ============================================================
# GET BEST FACE
# ============================================================

def get_best_face(image):

    faces = detect_faces(image)

    if faces is None:
        return None

    if len(faces) == 0:
        return None

    best_face = max(
        faces,
        key=lambda face: float(face[-1])
    )

    return best_face


# ============================================================
# EXTRACT SFACE FEATURE
# ============================================================

def extract_feature(image, face):

    try:

        aligned_face = face_recognizer.alignCrop(
            image,
            face
        )

        feature = face_recognizer.feature(
            aligned_face
        )

        feature = np.asarray(
            feature,
            dtype=np.float32
        )

        return feature

    except Exception as error:

        print(
            "\nFeature extraction error:",
            error
        )

        return None


# ============================================================
# BUILD STUDENT FACE DATABASE
# ============================================================

print("==============================================")
print(" BUILDING STU002 FACE DATABASE")
print("==============================================")

image_files = []

for filename in sorted(
    os.listdir(FACE_FOLDER)
):

    if filename.lower().endswith(
        (
            ".jpg",
            ".jpeg",
            ".png"
        )
    ):

        image_files.append(
            os.path.join(
                FACE_FOLDER,
                filename
            )
        )

print(
    "Images found:",
    len(image_files)
)

print()


student_features = []

successful = 0
failed = 0


# ============================================================
# PROCESS SAVED FACE IMAGES
# ============================================================

for index, image_path in enumerate(
    image_files,
    start=1
):

    image = cv2.imread(
        image_path
    )

    if image is None:

        failed += 1
        continue


    face = get_best_face(
        image
    )

    if face is None:

        failed += 1
        continue


    feature = extract_feature(
        image,
        face
    )

    if feature is None:

        failed += 1
        continue


    student_features.append(
        feature
    )

    successful += 1

    print(
        f"\rProcessing: "
        f"{index}/{len(image_files)}",
        end="",
        flush=True
    )


print()
print()

print("==============================================")
print(" DATABASE COMPLETE")
print("==============================================")

print(
    "Successful:",
    successful
)

print(
    "Failed:",
    failed
)

print()


# ============================================================
# CHECK DATABASE
# ============================================================

if len(student_features) == 0:

    print(
        "ERROR: No usable face features found."
    )

    raise SystemExit


# ============================================================
# CREATE AVERAGE REFERENCE EMBEDDING
# ============================================================

feature_matrix = np.vstack(
    student_features
)

average_feature = np.mean(
    feature_matrix,
    axis=0,
    keepdims=True
)

average_norm = np.linalg.norm(
    average_feature
)

if average_norm > 0:

    average_feature = (
        average_feature /
        average_norm
    )


print(
    "STU002 face embedding created successfully."
)

print()


# ============================================================
# OPEN CAMERA
# ============================================================

print("==============================================")
print(" STARTING CAMERA")
print("==============================================")

print()
print("Look at the camera.")
print("Press Q inside the camera window to quit.")
print()


camera = cv2.VideoCapture(
    CAMERA_INDEX
)


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
    "Camera opened successfully."
)

print(
    f"Camera resolution: "
    f"{actual_width} x {actual_height}"
)

print()

print(
    "Camera loop started."
)

print()


# ============================================================
# CAMERA WINDOW
# ============================================================

WINDOW_NAME = (
    "AI Student Monitoring - Face Recognition"
)

cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL
)


# ============================================================
# REAL-TIME RECOGNITION LOOP
# ============================================================

last_terminal_print = 0

running = True


while running:

    # --------------------------------------------------------
    # READ FRAME
    # --------------------------------------------------------

    success, frame = camera.read()


    if not success:

        print(
            "\nWARNING: "
            "Could not read camera frame."
        )

        time.sleep(0.05)

        continue


    # --------------------------------------------------------
    # MIRROR FRAME
    # --------------------------------------------------------

    frame = cv2.flip(
        frame,
        1
    )


    # --------------------------------------------------------
    # DETECT FACES
    # --------------------------------------------------------

    # IMPORTANT FIX:
    # detect_faces() calls setInputSize()
    # using the current frame dimensions.

    faces = detect_faces(
        frame
    )


    # ========================================================
    # NO FACE DETECTED
    # ========================================================

    if faces is None or len(faces) == 0:

        cv2.putText(
            frame,
            "No face detected",
            (30, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2
        )


    # ========================================================
    # FACE(S) DETECTED
    # ========================================================

    else:

        for face in faces:

            # ------------------------------------------------
            # FACE COORDINATES
            # ------------------------------------------------

            x = int(face[0])
            y = int(face[1])
            w = int(face[2])
            h = int(face[3])

            detection_confidence = float(
                face[-1]
            )


            # ------------------------------------------------
            # SAFE COORDINATES
            # ------------------------------------------------

            x = max(
                0,
                x
            )

            y = max(
                0,
                y
            )

            w = min(
                w,
                frame.shape[1] - x
            )

            h = min(
                h,
                frame.shape[0] - y
            )


            # ------------------------------------------------
            # DEFAULT RECOGNITION VALUES
            # ------------------------------------------------

            label = "Unknown Student"

            similarity = 0.0

            box_color = (
                0,
                0,
                255
            )


            # ------------------------------------------------
            # EXTRACT FACE FEATURE
            # ------------------------------------------------

            feature = extract_feature(
                frame,
                face
            )


            if feature is not None:

                try:

                    # ----------------------------------------
                    # NORMALIZE FEATURE
                    # ----------------------------------------

                    feature_norm = np.linalg.norm(
                        feature
                    )

                    if feature_norm > 0:

                        feature = (
                            feature /
                            feature_norm
                        )


                    # ----------------------------------------
                    # COSINE SIMILARITY
                    # ----------------------------------------

                    similarity = float(
                        face_recognizer.match(
                            average_feature,
                            feature,
                            cv2.FaceRecognizerSF_FR_COSINE
                        )
                    )


                    # ----------------------------------------
                    # RECOGNITION DECISION
                    # ----------------------------------------

                    if (
                        similarity >=
                        MATCH_THRESHOLD
                    ):

                        label = (
                            f"{STUDENT_ID} "
                            f"Recognized"
                        )

                        box_color = (
                            0,
                            255,
                            0
                        )

                    else:

                        label = (
                            "Unknown Student"
                        )

                        box_color = (
                            0,
                            0,
                            255
                        )


                except Exception as error:

                    print(
                        "\nMatching error:",
                        error
                    )


            # ------------------------------------------------
            # DRAW FACE BOX
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                box_color,
                3
            )


            # ------------------------------------------------
            # STUDENT LABEL
            # ------------------------------------------------

            cv2.putText(
                frame,
                label,
                (
                    x,
                    max(
                        30,
                        y - 15
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                box_color,
                2
            )


            # ------------------------------------------------
            # SIMILARITY
            # ------------------------------------------------

            cv2.putText(
                frame,
                f"Match: {similarity:.3f}",
                (
                    x,
                    y + h + 30
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                box_color,
                2
            )


            # ------------------------------------------------
            # FACE CONFIDENCE
            # ------------------------------------------------

            cv2.putText(
                frame,
                (
                    f"Face: "
                    f"{detection_confidence * 100:.1f}%"
                ),
                (
                    x,
                    y + h + 60
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                box_color,
                2
            )


            # ------------------------------------------------
            # TERMINAL STATUS
            # ------------------------------------------------

            current_time = time.time()

            if (
                current_time -
                last_terminal_print
                >= 1
            ):

                print(
                    f"\r{label} | "
                    f"Similarity: "
                    f"{similarity:.3f}",
                    end="",
                    flush=True
                )

                last_terminal_print = (
                    current_time
                )


    # ========================================================
    # TOP TITLE
    # ========================================================

    cv2.putText(
        frame,
        "AI Student Monitoring",
        (30, 95),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2
    )


    # ========================================================
    # STUDENT ID
    # ========================================================

    cv2.putText(
        frame,
        f"Student: {STUDENT_ID}",
        (
            30,
            frame.shape[0] - 45
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
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
            frame.shape[0] - 15
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )


    # ========================================================
    # DISPLAY
    # ========================================================

    cv2.imshow(
        WINDOW_NAME,
        frame
    )


    # ========================================================
    # KEYBOARD
    # ========================================================

    key = cv2.waitKey(10) & 0xFF


    if key == ord("q"):

        print()
        print()

        print(
            "Q pressed. "
            "Stopping recognition..."
        )

        running = False


# ============================================================
# CLEANUP
# ============================================================

camera.release()

cv2.destroyAllWindows()

for _ in range(3):

    cv2.waitKey(1)


print()

print("==============================================")
print(" FACE RECOGNITION STOPPED")
print("==============================================")

print(
    "Program finished."
)