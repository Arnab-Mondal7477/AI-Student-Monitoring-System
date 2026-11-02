import requests
import json

payload = {
    "student_id": "STU001",
    "object_name": "Mobile Phone",
    "detection_type": "PHONE_VIOLATION",
    "location": "Main Camera",
    "confidence": 0.95,
    "evidence_path": "/Users/arnab/Documents/AI-Student-Monitoring/evidence/fake_face_20260829_1700.jpg",
    "alert_sent": False
}

try:
    res = requests.post("http://localhost:5000/api/monitoring/detections", json=payload, timeout=2)
    print("Node Backend Response:", res.status_code, res.text)
except Exception as e:
    print("Error:", e)

