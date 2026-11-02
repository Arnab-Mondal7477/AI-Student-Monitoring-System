from datetime import datetime
from typing import Optional


class MonitoringSession:
    def __init__(self):
        self.active = False
        self.student_id: Optional[str] = None
        self.started_at: Optional[datetime] = None

    def start(self, student_id: str):
        self.active = True
        self.student_id = student_id
        self.started_at = datetime.now()

        return {
            "message": "Monitoring session started",
            "student_id": self.student_id,
            "started_at": self.started_at.isoformat()
        }

    def stop(self):
        if not self.active:
            return {
                "message": "No active monitoring session"
            }

        result = {
            "message": "Monitoring session stopped",
            "student_id": self.student_id,
            "started_at": self.started_at.isoformat()
        }

        self.active = False
        self.student_id = None
        self.started_at = None

        return result

    def get_current(self):
        return {
            "active": self.active,
            "student_id": self.student_id,
            "started_at": (
                self.started_at.isoformat()
                if self.started_at
                else None
            )
        }


monitoring_session = MonitoringSession()