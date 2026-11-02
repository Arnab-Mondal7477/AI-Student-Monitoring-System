import cv2

from phone_detector import process_frame


IMAGE_PATH = "test_phone.jpg"


image = cv2.imread(IMAGE_PATH)

if image is None:
    print("❌ Could not open test_phone.jpg")
    print("Make sure the image is inside AI-Student-Monitoring.")
    exit()


print("🔍 Running YOLO11 phone detection...")

phone_detected = process_frame(
    image,
    save_evidence=True
)

if phone_detected:
    print("✅ Phone detection pipeline completed.")
else:
    print("ℹ️ No mobile phone detected.")