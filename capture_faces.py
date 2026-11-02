import cv2
import os
import time


# ==========================================
# AI STUDENT MONITORING
# FACE CAPTURE SYSTEM
# OpenCV 5 + YuNet
# ==========================================


# ------------------------------------------
# STUDENT CONFIGURATION
# ------------------------------------------

STUDENT_ID = "STU002"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "face_detection_yunet_2026may.onnx"
)

SAVE_DIR = os.path.join(
    BASE_DIR,
    "student_faces",
    STUDENT_ID
)

os.makedirs(SAVE_DIR, exist_ok=True)


# ------------------------------------------
# CHECK MODEL
# ------------------------------------------

if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(
        f"\nYuNet model not found:\n{MODEL_PATH}\n\n"
        "Download the model first."
    )


# ------------------------------------------
# CREATE YUNET FACE DETECTOR
# ------------------------------------------

print("==========================================")
print(" AI STUDENT MONITORING")
print(" Face Capture System")
print("==========================================")

print(f"OpenCV version : {cv2.__version__}")
print(f"Student ID     : {STUDENT_ID}")
print(f"Save directory : {SAVE_DIR}")
print("")

print("Loading YuNet face detector...")


face_detector = cv2.FaceDetectorYN.create(

    MODEL_PATH,

    "",

    (320, 320),

    0.6,

    0.3,

    5000
)


print("✅ YuNet loaded successfully")


# ------------------------------------------
# OPEN CAMERA
# ------------------------------------------

print("")
print("Starting camera...")


camera = cv2.VideoCapture(0)


if not camera.isOpened():

    raise RuntimeError(
        "❌ Camera could not be opened.\n"
        "Check macOS Camera permission for Terminal/Python."
    )


print("✅ Camera started")
print("")
print("Look at the camera.")
print("Move your face slightly left/right/up/down.")
print("Press Q to stop.")
print("")


# ------------------------------------------
# CAPTURE SETTINGS
# ------------------------------------------

saved_count = 0

frame_count = 0

last_save_time = 0

SAVE_INTERVAL = 1.0


# ------------------------------------------
# CAMERA LOOP
# ------------------------------------------

while True:

    ret, frame = camera.read()

    if not ret:

        print("❌ Could not read camera frame.")

        break


    frame_count += 1


    # --------------------------------------
    # FRAME SIZE
    # --------------------------------------

    height, width = frame.shape[:2]


    # --------------------------------------
    # UPDATE YUNET INPUT SIZE
    # --------------------------------------

    face_detector.setInputSize(
        (width, height)
    )


    # --------------------------------------
    # DETECT FACES
    # --------------------------------------

    _, faces = face_detector.detect(frame)


    face_count = 0


    if faces is not None:

        face_count = len(faces)


        for face in faces:

            # ----------------------------------
            # FACE COORDINATES
            # ----------------------------------

            x = int(face[0])
            y = int(face[1])
            w = int(face[2])
            h = int(face[3])


            # ----------------------------------
            # CONFIDENCE
            # ----------------------------------

            confidence = float(face[-1])


            # ----------------------------------
            # KEEP COORDINATES INSIDE FRAME
            # ----------------------------------

            x = max(0, x)
            y = max(0, y)

            w = min(w, width - x)
            h = min(h, height - y)


            # ----------------------------------
            # DRAW FACE RECTANGLE
            # ----------------------------------

            cv2.rectangle(

                frame,

                (x, y),

                (x + w, y + h),

                (0, 255, 0),

                2
            )


            # ----------------------------------
            # DISPLAY CONFIDENCE
            # ----------------------------------

            label = (
                f"Face {confidence * 100:.1f}%"
            )


            cv2.putText(

                frame,

                label,

                (x, max(25, y - 10)),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.7,

                (0, 255, 0),

                2
            )


            # ----------------------------------
            # CROP FACE
            # ----------------------------------

            face_crop = frame[
                y:y + h,
                x:x + w
            ]


            if face_crop.size == 0:

                continue


            # ----------------------------------
            # SAVE FACE
            # ----------------------------------

            current_time = time.time()


            if (
                current_time - last_save_time
                >= SAVE_INTERVAL
            ):

                timestamp = time.strftime(
                    "%Y%m%d_%H%M%S"
                )


                filename = os.path.join(

                    SAVE_DIR,

                    f"{STUDENT_ID}_{timestamp}_{saved_count + 1}.jpg"
                )


                success = cv2.imwrite(
                    filename,
                    face_crop
                )


                if success:

                    saved_count += 1

                    last_save_time = current_time

                    print(
                        f"📸 Face saved "
                        f"({saved_count}): "
                        f"{filename}"
                    )


    # --------------------------------------
    # INFORMATION DISPLAY
    # --------------------------------------

    cv2.putText(

        frame,

        f"Student: {STUDENT_ID}",

        (20, 35),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.8,

        (0, 255, 0),

        2
    )


    cv2.putText(

        frame,

        f"Faces detected: {face_count}",

        (20, 70),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.7,

        (0, 255, 0),

        2
    )


    cv2.putText(

        frame,

        f"Faces saved: {saved_count}",

        (20, 105),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.7,

        (0, 255, 0),

        2
    )


    cv2.putText(

        frame,

        "Press Q to quit",

        (20, height - 20),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.6,

        (255, 255, 255),

        2
    )


    # --------------------------------------
    # SHOW CAMERA
    # --------------------------------------

    cv2.imshow(

        "AI Student Monitoring - Face Capture",

        frame
    )


    # --------------------------------------
    # QUIT
    # --------------------------------------

    key = cv2.waitKey(1) & 0xFF


    if key == ord("q"):

        break


# ------------------------------------------
# CLEANUP
# ------------------------------------------

camera.release()

cv2.destroyAllWindows()


print("")
print("==========================================")
print(" Face capture completed")
print("==========================================")
print(f"Student ID   : {STUDENT_ID}")
print(f"Faces saved  : {saved_count}")
print(f"Location     : {SAVE_DIR}")
print("==========================================")