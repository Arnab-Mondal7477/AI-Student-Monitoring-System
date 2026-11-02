import requests
import json
import time

payload = {
    "student_id": "UNKNOWN",
    "object_name": "face presence",
    "detection_type": "FACE_PRESENCE",
    "location": "Main Camera",
    "confidence": 0.85,
    "evidence_path": "/Users/arnab/Documents/AI-Student-Monitoring/evidence/fake_face_20260829_1700.jpg",
    "alert_sent": False
}

try:
    res = requests.post("http://127.0.0.1:8000/phone-detections", json=payload, timeout=2)
    print("Python Backend Response:", res.status_code, res.text)
except Exception as e:
    print("Error:", e)

