import cv2
import os
import numpy as np
import time
import requests
from datetime import datetime
from ultralytics import YOLO


# ============================================================
# AI STUDENT MONITORING SYSTEM
# MULTI-STUDENT FACE + PHONE DETECTION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# FILE PATHS
# ============================================================

YUNET_MODEL = os.path.join(
    BASE_DIR,
    "face_detection_yunet_2026may.onnx"
)

SFACE_MODEL = os.path.join(
    BASE_DIR,
    "face_recognition_sface_2021dec.onnx"
)

YOLO_MODEL = os.path.join(
    BASE_DIR,
    "yolo11n.pt"
)

STUDENT_FACES_DIR = os.path.join(
    BASE_DIR,
    "student_faces"
)

EVIDENCE_FOLDER = os.path.join(
    BASE_DIR,
    "evidence"
)


# ============================================================
# CAMERA CONFIGURATION
# ============================================================

CAMERA_INDEX = 0

CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720


# ============================================================
# YUNET FACE DETECTION
# ============================================================

SCORE_THRESHOLD = 0.6
NMS_THRESHOLD = 0.3
TOP_K = 5000


# ============================================================
# SFACE RECOGNITION
# ============================================================

MATCH_THRESHOLD = 0.50


# ============================================================
# STABLE FACE RECOGNITION
# ============================================================

REQUIRED_RECOGNITION_FRAMES = 5


# ============================================================
# YOLO PHONE DETECTION
# ============================================================

PHONE_CONFIDENCE = 0.50


# ============================================================
# PHONE VIOLATION COOLDOWN
# ============================================================

PHONE_COOLDOWN = 5


# ============================================================
# BACKEND
# ============================================================

BACKEND_URL = "http://127.0.0.1:8000"


# ============================================================
# CREATE REQUIRED FOLDERS
# ============================================================

os.makedirs(
    EVIDENCE_FOLDER,
    exist_ok=True
)

os.makedirs(
    STUDENT_FACES_DIR,
    exist_ok=True
)


# ============================================================
# START
# ============================================================

print("================================================")
print(" AI STUDENT MONITORING SYSTEM")
print(" MULTI-STUDENT FACE + PHONE DETECTION")
print("================================================")
print()

print(
    "Face match threshold:",
    MATCH_THRESHOLD
)

print(
    "Required stable recognition frames:",
    REQUIRED_RECOGNITION_FRAMES
)

print()


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

required_files = [
    YUNET_MODEL,
    SFACE_MODEL,
    YOLO_MODEL,
    STUDENT_FACES_DIR
]


for required_file in required_files:

    if not os.path.exists(required_file):

        print(
            "ERROR: Required file/folder not found:"
        )

        print(
            required_file
        )

        raise SystemExit


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

print(
    "YuNet loaded successfully."
)

print()


# ============================================================
# LOAD SFACE
# ============================================================

print("Loading SFace face recognition...")

face_recognizer = cv2.FaceRecognizerSF.create(
    SFACE_MODEL,
    ""
)

print(
    "SFace loaded successfully."
)

print()


# ============================================================
# LOAD YOLO
# ============================================================

print("Loading YOLO11 phone detector...")

yolo_model = YOLO(
    YOLO_MODEL
)

print(
    "YOLO11 loaded successfully."
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
# FACE FEATURE EXTRACTION
# ============================================================

def extract_feature(
    image,
    face
):

    try:

        aligned_face = (
            face_recognizer.alignCrop(
                image,
                face
            )
        )

        feature = (
            face_recognizer.feature(
                aligned_face
            )
        )

        return np.asarray(
            feature,
            dtype=np.float32
        )

    except Exception:

        return None


# ============================================================
# BUILD MULTI-STUDENT FACE DATABASE
# ============================================================

print("================================================")
print(" BUILDING STUDENT FACE DATABASE")
print("================================================")
print()


student_database = {}


student_folders = sorted(
    os.listdir(
        STUDENT_FACES_DIR
    )
)


for student_id in student_folders:

    student_folder = os.path.join(
        STUDENT_FACES_DIR,
        student_id
    )

    if not os.path.isdir(
        student_folder
    ):
        continue


    image_files = []


    for filename in sorted(
        os.listdir(student_folder)
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
                    student_folder,
                    filename
                )
            )


    if len(image_files) == 0:

        print(
            f"{student_id}: No face images found"
        )

        continue


    print(
        f"Student {student_id}: "
        f"{len(image_files)} images"
    )


    student_features = []

    successful = 0
    failed = 0


    for image_path in image_files:

        image = cv2.imread(
            image_path
        )


        if image is None:

            failed += 1
            continue


        faces = detect_faces(
            image
        )


        if (
            faces is None
            or
            len(faces) == 0
        ):

            failed += 1
            continue


        # ----------------------------------------------------
        # Select strongest face
        # ----------------------------------------------------

        best_face = max(
            faces,
            key=lambda face: float(
                face[-1]
            )
        )


        feature = extract_feature(
            image,
            best_face
        )


        if feature is None:

            failed += 1
            continue


        student_features.append(
            feature
        )

        successful += 1


    # --------------------------------------------------------
    # Create student embedding
    # --------------------------------------------------------

    if len(student_features) == 0:

        print(
            f"WARNING: "
            f"No valid faces for {student_id}"
        )

        continue


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


    student_database[
        student_id
    ] = average_feature


    print(
        f"  Successful: {successful}"
    )

    print(
        f"  Failed: {failed}"
    )

    print(
        f"  {student_id} embedding created."
    )

    print()


# ============================================================
# CHECK DATABASE
# ============================================================

if len(student_database) == 0:

    print(
        "ERROR: No student face databases found."
    )

    print(
        "Add face images inside:"
    )

    print(
        "student_faces/STUDENT_ID/"
    )

    raise SystemExit


print("================================================")
print(" REGISTERED STUDENTS")
print("================================================")

for student_id in student_database:

    print(
        "✓",
        student_id
    )

print()

print(
    "Total registered students:",
    len(student_database)
)

print()


# ============================================================
# OPEN CAMERA
# ============================================================

print("================================================")
print(" STARTING AI MONITOR")
print("================================================")
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
        # FACE RECOGNITION
        # ====================================================

        faces = detect_faces(
            frame
        )


        frame_best_student = None

        frame_best_similarity = 0.0

        frame_best_face = None


        if (
            faces is not None
            and
            len(faces) > 0
        ):

            for face in faces:

                # ------------------------------------------------
                # FACE COORDINATES
                # ------------------------------------------------

                x = int(
                    face[0]
                )

                y = int(
                    face[1]
                )

                w = int(
                    face[2]
                )

                h = int(
                    face[3]
                )


                # ------------------------------------------------
                # DEFAULT FACE STATUS
                # ------------------------------------------------

                recognized_student = None

                highest_similarity = 0.0


                # ------------------------------------------------
                # EXTRACT FACE FEATURE
                # ------------------------------------------------

                feature = extract_feature(
                    frame,
                    face
                )


                if feature is not None:

                    feature_norm = np.linalg.norm(
                        feature
                    )


                    if feature_norm > 0:

                        feature = (
                            feature /
                            feature_norm
                        )


                    # =================================================
                    # COMPARE AGAINST ALL REGISTERED STUDENTS
                    # =================================================

                    for student_id, reference_feature in student_database.items():

                        similarity = float(
                            face_recognizer.match(
                                reference_feature,
                                feature,
                                cv2.FaceRecognizerSF_FR_COSINE
                            )
                        )


                        if similarity > highest_similarity:

                            highest_similarity = (
                                similarity
                            )

                            recognized_student = (
                                student_id
                            )


                # =================================================
                # DETERMINE FACE LABEL
                # =================================================

                if (
                    recognized_student is not None
                    and
                    highest_similarity
                    >=
                    MATCH_THRESHOLD
                ):

                    label = (
                        f"{recognized_student}"
                    )

                    box_color = (
                        0,
                        255,
                        0
                    )

                    # Keep best recognized face

                    if (
                        highest_similarity
                        >
                        frame_best_similarity
                    ):

                        frame_best_similarity = (
                            highest_similarity
                        )

                        frame_best_student = (
                            recognized_student
                        )

                        frame_best_face = face

                else:

                    label = (
                        "Unknown Student"
                    )

                    box_color = (
                        0,
                        0,
                        255
                    )


                # =================================================
                # DRAW FACE BOX
                # =================================================

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
                    box_color,
                    3
                )


                # =================================================
                # FACE LABEL
                # =================================================

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


                # =================================================
                # MATCH SCORE
                # =================================================

                cv2.putText(
                    frame,
                    f"Match: {highest_similarity:.3f}",
                    (
                        x,
                        y + h + 30
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    box_color,
                    2
                )


        # ========================================================
        # STABLE FACE RECOGNITION
        # ========================================================

        if (
            frame_best_student is not None
            and
            frame_best_similarity
            >=
            MATCH_THRESHOLD
        ):

            # Continue same student's recognition

            if (
                stable_student
                ==
                frame_best_student
            ):

                recognition_counter += 1

            elif stable_student is None:

                recognition_counter += 1

            else:

                recognition_counter = 1


        else:

            recognition_counter = max(
                0,
                recognition_counter - 1
            )


        # ========================================================
        # CONFIRM STUDENT
        # ========================================================

        if (
            frame_best_student is not None
            and
            recognition_counter
            >=
            REQUIRED_RECOGNITION_FRAMES
        ):

            stable_student = (
                frame_best_student
            )


        elif recognition_counter == 0:

            stable_student = None


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


        if (
            phone_detected
            and
            stable_student is not None
            and
            frame_best_student
            ==
            stable_student
            and
            frame_best_similarity
            >=
            MATCH_THRESHOLD
            and
            current_time
            -
            last_phone_detection
            >=
            PHONE_COOLDOWN
        ):

            # ====================================================
            # IST TIMESTAMP
            # ====================================================

            timestamp = datetime.now().strftime(
                "%Y%m%d_%H%M%S"
            )


            # ====================================================
            # EVIDENCE FILE
            # ====================================================

            evidence_filename = (
                f"phone_"
                f"{stable_student}_"
                f"{timestamp}.jpg"
            )


            evidence_path = os.path.join(
                EVIDENCE_FOLDER,
                evidence_filename
            )


            # ====================================================
            # SAVE EVIDENCE
            # ====================================================

            saved = cv2.imwrite(
                evidence_path,
                frame
            )


            # ====================================================
            # CONSOLE ALERT
            # ====================================================

            print()

            print(
                "============================================"
            )

            print(
                "PHONE VIOLATION DETECTED"
            )

            print(
                "Student:",
                stable_student
            )

            print(
                "Face match:",
                f"{frame_best_similarity:.3f}"
            )

            print(
                "Phone confidence:",
                f"{phone_confidence:.3f}"
            )

            print(
                "Evidence:",
                evidence_path
            )

            print(
                "Evidence saved:",
                saved
            )

            print(
                "============================================"
            )


            # ====================================================
            # SEND DETECTION TO BACKEND
            # ====================================================

            try:

                response = requests.post(
                    f"{BACKEND_URL}/phone-detections",

                    json={

                        "student_id":
                            stable_student,

                        "object_name":
                            "cell phone",

                        "confidence":
                            phone_confidence,

                        "evidence_path":
                            evidence_path,

                        "alert_sent":
                            False
                    },

                    timeout=3
                )


                if response.status_code in [
                    200,
                    201
                ]:

                    print(
                        "Database:",
                        "Detection saved successfully"
                    )

                else:

                    print(
                        "Database error:",
                        response.status_code
                    )

                    print(
                        response.text
                    )


            except Exception as error:

                print(
                    "Backend connection error:"
                )

                print(
                    error
                )


            # ====================================================
            # UPDATE COOLDOWN
            # ====================================================

            last_phone_detection = (
                current_time
            )


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
