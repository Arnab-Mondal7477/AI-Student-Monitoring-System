import requests

payload = {
    "student_id": "STU001",
    "object_name": "Mobile Phone",
    "detection_type": "PHONE_VIOLATION",
    "location": "Room 304",
    "confidence": 0.99,
    "evidence_path": "/Users/arnab/Documents/AI-Student-Monitoring/evidence/phone_STU001.jpg",
    "alert_sent": False
}

try:
    res = requests.post("http://localhost:5000/api/monitoring/detections", json=payload, timeout=2)
    print("Node Backend Response:", res.status_code, res.text)
except Exception as e:
    print("Error:", e)
