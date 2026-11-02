import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import io
import csv
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from email_service import send_violation_email
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, text, inspect

from database import engine, AsyncSessionLocal, Base
from models import Student, PhoneDetection, AttendanceLog, Department, Curriculum, Semester, Subject, ElectiveGroup, ElectiveOption


# ============================================================
# WEBSOCKET MANAGER
# ============================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()


async def update_attendance_record(student_id: str, is_violation: bool):
    if not student_id or student_id.upper() in ["UNKNOWN", "UNKNOWN STUDENT"] or student_id.upper().startswith("VISITOR"):
        return
    today_str = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
    now_dt = datetime.now(ZoneInfo("Asia/Kolkata"))

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AttendanceLog).where(
                AttendanceLog.student_id == student_id,
                AttendanceLog.date_str == today_str
            )
        )
        record = result.scalar_one_or_none()
        if record:
            record.last_seen_at = now_dt
            if is_violation:
                record.violation_count += 1
        else:
            record = AttendanceLog(
                student_id=student_id,
                date_str=today_str,
                first_seen_at=now_dt,
                last_seen_at=now_dt,
                status="PRESENT",
                violation_count=1 if is_violation else 0
            )
            session.add(record)
        await session.commit()



# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

EVIDENCE_DIR = BASE_DIR / "evidence"
STUDENT_FACES_DIR = BASE_DIR / "student_faces"
DASHBOARD_DIR = BASE_DIR / "dashboard"

EVIDENCE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

STUDENT_FACES_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# APPLICATION STARTUP
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("🚀 Starting AI Student Monitoring API...")

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all
        )
        def migrate_schema(sync_conn):
            inspector = inspect(sync_conn)
            if 'phone_detections' in inspector.get_table_names():
                cols = [c['name'] for c in inspector.get_columns('phone_detections')]
                if 'detection_type' not in cols:
                    sync_conn.execute(text("ALTER TABLE phone_detections ADD COLUMN detection_type VARCHAR(50) DEFAULT 'PHONE_VIOLATION'"))
        await conn.run_sync(migrate_schema)

    print("✅ Database initialized")

    print(
        "📁 Evidence folder:",
        EVIDENCE_DIR
    )

    print(
        "📁 Student faces folder:",
        STUDENT_FACES_DIR
    )

    yield

    await engine.dispose()

    print("🛑 API stopped")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Based Student Monitoring System",
    description=(
        "AI-powered student monitoring backend "
        "using FastAPI, YOLO11 and SQLite."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class StudentCreate(BaseModel):

    student_id: str
    name: str
    email: EmailStr


class DetectionCreate(BaseModel):

    student_id: str
    object_name: str
    confidence: float
    detection_type: str = "FACE_ENTRY"
    evidence_path: str | None = None


class PhoneDetectionCreate(BaseModel):

    student_id: str
    object_name: str = "cell phone"
    detection_type: str = "PHONE_VIOLATION"
    location: str = "Main Camera"
    confidence: float
    evidence_path: str | None = None
    alert_sent: bool = False


class SessionCreate(BaseModel):

    student_id: str

class DepartmentCreate(BaseModel):
    name: str
    code: str
    plan: str = "free"

class CurriculumCreate(BaseModel):
    batch_year: int
    program_name: str
    total_semesters: int = 8
    
class SemesterCreate(BaseModel):
    number: int


class SubjectCreate(BaseModel):
    semester_id: int
    course_code: str
    course_name: str
    l: int = 0
    t: int = 0
    p: int = 0
    cia_marks: int = 0
    tee_marks: int = 0
    total_marks: int = 0
    credits: float = 0.0
    course_type: str
    is_elective_group: bool = False
    elective_group_id: int | None = None

class SubjectUpdate(BaseModel):
    course_code: str | None = None
    course_name: str | None = None
    l: int | None = None
    t: int | None = None
    p: int | None = None
    cia_marks: int | None = None
    tee_marks: int | None = None
    total_marks: int | None = None
    credits: float | None = None
    course_type: str | None = None
    is_elective_group: bool | None = None
    elective_group_id: int | None = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "status": "online",
        "project": "AI Based Object Student Monitoring",
        "version": "1.0.0",
        "message": (
            "AI Student Monitoring API "
            "is running successfully"
        ),
        "features": [
            "Student Management",
            "YOLO11 Object Detection",
            "Phone Detection",
            "Face Recognition",
            "Evidence Storage",
            "Student Sessions",
            "Database Logging"
        ]
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health():
    db_status = "connected"
    student_count = 0
    detection_count = 0

    try:
        async with AsyncSessionLocal() as session:
            stu_res = await session.execute(select(func.count(Student.id)))
            student_count = stu_res.scalar() or 0
            det_res = await session.execute(select(func.count(PhoneDetection.id)))
            detection_count = det_res.scalar() or 0
    except Exception as e:
        db_status = f"error: {str(e)}"

    evidence_count = 0
    if EVIDENCE_DIR.exists():
        evidence_count = len([f for f in EVIDENCE_DIR.iterdir() if f.is_file()])

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "total_students": student_count,
        "total_detections": detection_count,
        "evidence_files": evidence_count,
        "ai_engine": "YOLO11",
        "time": datetime.now().isoformat()
    }


# ============================================================
# HELPER: ENROLLED FACE IMAGES
# ============================================================

def get_student_faces(student_id: str):
    folder = STUDENT_FACES_DIR / student_id
    images = []
    if folder.exists():
        for file in sorted(folder.iterdir()):
            if file.is_file() and file.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                images.append({
                    "filename": file.name,
                    "url": f"/student-faces/{student_id}/{file.name}"
                })
    return images


# ============================================================
# STUDENT APIs
# ============================================================

@app.get("/students")
async def get_students():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).order_by(
                Student.id
            )
        )

        students = result.scalars().all()

        return {
            "count": len(students),
            "students": [
                {
                    "id": student.id,
                    "student_id": student.student_id,
                    "name": student.name,
                    "email": student.email,
                    "face_images": get_student_faces(student.student_id),
                    "avatar_url": get_student_faces(student.student_id)[0]["url"] if get_student_faces(student.student_id) else None
                }
                for student in students
            ]
        }


# ============================================================
# GET SINGLE STUDENT
# ============================================================

@app.get("/students/{student_id}")
async def get_student(
    student_id: str
):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).where(
                Student.student_id
                == student_id
            )
        )

        student = result.scalar_one_or_none()

        if student is None:

            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )

        faces = get_student_faces(student.student_id)
        return {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email,
            "face_images": faces,
            "avatar_url": faces[0]["url"] if faces else None
        }


# ============================================================
# CREATE STUDENT (JSON Body)
# ============================================================

@app.post("/students")
async def create_student(
    student_data: StudentCreate
):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).where(
                Student.student_id
                == student_data.student_id
            )
        )

        existing = result.scalar_one_or_none()

        if existing:

            raise HTTPException(
                status_code=400,
                detail="Student ID already exists"
            )

        student = Student(
            student_id=student_data.student_id,
            name=student_data.name,
            email=student_data.email
        )

        session.add(student)

        await session.commit()

        await session.refresh(student)

        student_folder = (
            STUDENT_FACES_DIR
            / student.student_id
        )

        student_folder.mkdir(
            parents=True,
            exist_ok=True
        )

        faces = get_student_faces(student.student_id)
        return {
            "success": True,
            "message": "Student created successfully",
            "student": {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "face_images": faces,
                "avatar_url": faces[0]["url"] if faces else None
            }
        }


# ============================================================
# REGISTER STUDENT WITH FACE IMAGES (Multipart Form)
# ============================================================

@app.post("/students/register")
async def register_student_with_faces(
    student_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    pose_category: str = Form("front"),
    files: list[UploadFile] = File(None)
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Student).where(Student.student_id == student_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Student ID already exists"
            )

        student = Student(
            student_id=student_id,
            name=name,
            email=email
        )
        session.add(student)
        await session.commit()
        await session.refresh(student)

    target_dir = STUDENT_FACES_DIR / student.student_id
    if pose_category and pose_category.lower() in ["front", "left", "right", "up", "down"]:
        target_dir = target_dir / pose_category.lower()
    target_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    if files:
        for idx, file in enumerate(files):
            if file and file.filename:
                ext = Path(file.filename).suffix.lower() or ".jpg"
                filename = f"face_{int(datetime.now().timestamp())}_{idx}{ext}"
                dest = target_dir / filename
                content = await file.read()
                dest.write_bytes(content)
                saved_files.append(filename)

    faces = get_student_faces(student.student_id)

    return {
        "success": True,
        "message": f"Profile {student_id} registered with {len(saved_files)} face image(s)",
        "student": {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email,
            "face_images": faces,
            "avatar_url": faces[0]["url"] if faces else None
        }
    }


# ============================================================
# UPLOAD FACE IMAGE TO EXISTING PROFILE
# ============================================================

@app.post("/students/{student_id}/upload-face")
async def upload_student_face(
    student_id: str,
    pose_category: str = Form("front"),
    files: list[UploadFile] = File(...)
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Student).where(Student.student_id == student_id)
        )
        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )

    target_dir = STUDENT_FACES_DIR / student_id
    if pose_category and pose_category.lower() in ["front", "left", "right", "up", "down"]:
        target_dir = target_dir / pose_category.lower()
    target_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for idx, file in enumerate(files):
        if file and file.filename:
            ext = Path(file.filename).suffix.lower() or ".jpg"
            filename = f"face_{int(datetime.now().timestamp())}_{idx}{ext}"
            dest = target_dir / filename
            content = await file.read()
            dest.write_bytes(content)
            saved_files.append(filename)

    faces = get_student_faces(student_id)

    return {
        "success": True,
        "message": f"Uploaded {len(saved_files)} face photo(s) for {student_id}",
        "face_images": faces,
        "avatar_url": faces[0]["url"] if faces else None
    }


# ============================================================
# GET STUDENT FACE PROFILE STATUS
# ============================================================

@app.get("/students/{student_id}/face-profile")
async def get_student_face_profile(student_id: str):
    student_folder = STUDENT_FACES_DIR / student_id
    if not student_folder.exists() or not student_folder.is_dir():
        return {
            "student_id": student_id,
            "total_views": 0,
            "pose_count": 0,
            "pose_map": {"front": False, "left": False, "right": False, "up": False, "down": False},
            "registered_poses": [],
            "status": "INCOMPLETE",
            "completeness_pct": 0
        }

    pose_map = {"front": False, "left": False, "right": False, "up": False, "down": False}
    total_images = 0

    for root, _, files in os.walk(student_folder):
        rel_dir = Path(root).relative_to(student_folder).as_posix().lower()
        valid_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        total_images += len(valid_files)
        if len(valid_files) > 0:
            if rel_dir in pose_map:
                pose_map[rel_dir] = True
            elif rel_dir == ".":
                pose_map["front"] = True

    registered_poses = [pose for pose, has_img in pose_map.items() if has_img]
    pose_count = len(registered_poses)

    if pose_count >= 4 or total_images >= 5:
        status = "EXCELLENT"
        completeness = 100
    elif total_images >= 3:
        status = "GOOD"
        completeness = 70
    else:
        status = "INCOMPLETE"
        completeness = 35 if total_images > 1 else 20

    return {
        "student_id": student_id,
        "total_views": total_images,
        "pose_count": pose_count,
        "pose_map": pose_map,
        "registered_poses": registered_poses,
        "status": status,
        "completeness_pct": completeness
    }


# ============================================================
# UPDATE STUDENT PROFILE (PUT)
# ============================================================

@app.put("/students/{student_id}")
async def update_student(
    student_id: str,
    name: str = Form(None),
    email: str = Form(None)
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Student).where(Student.student_id == student_id)
        )
        student = result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        if name:
            student.name = name.strip()
        if email:
            student.email = email.strip()

        await session.commit()
        await session.refresh(student)

        faces = get_student_faces(student_id)
        return {
            "success": True,
            "message": "Student profile updated successfully",
            "student": {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "face_images": faces,
                "avatar_url": faces[0]["url"] if faces else None
            }
        }


# ============================================================
# DELETE STUDENT PROFILE (DELETE)
# ============================================================

@app.delete("/students/{student_id}")
async def delete_student(student_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Student).where(Student.student_id == student_id)
        )
        student = result.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        await session.delete(student)
        await session.commit()

    student_folder = STUDENT_FACES_DIR / student_id
    if student_folder.exists():
        shutil.rmtree(student_folder, ignore_errors=True)

    return {
        "success": True,
        "message": f"Member {student_id} removed successfully"
    }


# ============================================================
# DELETE SPECIFIC FACE PHOTO FROM STUDENT PROFILE
# ============================================================

@app.delete("/students/{student_id}/face/{filename}")
async def delete_student_face(student_id: str, filename: str):
    face_path = STUDENT_FACES_DIR / student_id / filename
    if face_path.exists() and face_path.is_file():
        face_path.unlink()

    faces = get_student_faces(student_id)
    return {
        "success": True,
        "message": f"Face image {filename} removed",
        "face_images": faces,
        "avatar_url": faces[0]["url"] if faces else None
    }


# ============================================================
# WEBSOCKET REAL-TIME STREAMING
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ============================================================
# CSV TELEMETRY REPORT EXPORT
# ============================================================

@app.get("/reports/export")
async def export_telemetry_csv(category: str = "all"):
    async with AsyncSessionLocal() as session:
        query = select(PhoneDetection).order_by(PhoneDetection.id.desc())
        result = await session.execute(query)
        detections = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student_ID", "Object_Name", "Detection_Type", "Confidence", "Timestamp_IST", "Evidence_Path"])

    for d in detections:
        student_id = d.student_id or "UNKNOWN"
        is_visitor = student_id.upper() in ["UNKNOWN", "UNKNOWN STUDENT"] or student_id.upper().startswith("VISITOR")
        is_phone = (d.detection_type or "").upper() == "PHONE_VIOLATION"

        if category == "reg_phone" and (is_visitor or not is_phone): continue
        if category == "reg_face" and (is_visitor or is_phone): continue
        if category == "unreg_phone" and (not is_visitor or not is_phone): continue
        if category == "unreg_face" and (not is_visitor or is_phone): continue

        writer.writerow([
            d.id,
            student_id,
            d.object_name,
            d.detection_type or "PHONE_VIOLATION",
            f"{d.confidence:.4f}",
            d.detected_at.strftime("%Y-%m-%d %H:%M:%S") if d.detected_at else "",
            d.evidence_path or ""
        ])

    output.seek(0)
    filename = f"telemetry_report_{category}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============================================================
# DAILY ATTENDANCE ROSTER
# ============================================================

@app.get("/attendance/today")
async def get_today_attendance():
    today_str = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
    async with AsyncSessionLocal() as session:
        stu_res = await session.execute(select(Student))
        all_students = stu_res.scalars().all()

        att_res = await session.execute(
            select(AttendanceLog).where(AttendanceLog.date_str == today_str)
        )
        logs = {a.student_id: a for a in att_res.scalars().all()}

    roster = []
    total_hours_sum = 0.0

    for s in all_students:
        log = logs.get(s.student_id)
        if log:
            first_time = log.first_seen_at.strftime("%I:%M %p") if log.first_seen_at else "—"
            last_time = log.last_seen_at.strftime("%I:%M %p") if log.last_seen_at else "—"
            duration_mins = int((log.last_seen_at - log.first_seen_at).total_seconds() / 60) if (log.last_seen_at and log.first_seen_at) else 0
            hours = round(duration_mins / 60.0, 1)
            classes = max(1 if duration_mins > 0 else 0, round(duration_mins / 50.0))
            total_hours_sum += hours

            roster.append({
                "student_id": s.student_id,
                "name": s.name,
                "email": s.email,
                "status": log.status,
                "first_seen": first_time,
                "last_seen": last_time,
                "duration_minutes": duration_mins,
                "total_hours": hours,
                "estimated_classes": classes,
                "violation_count": log.violation_count
            })
        else:
            roster.append({
                "student_id": s.student_id,
                "name": s.name,
                "email": s.email,
                "status": "ABSENT",
                "first_seen": "—",
                "last_seen": "—",
                "duration_minutes": 0,
                "total_hours": 0.0,
                "estimated_classes": 0,
                "violation_count": 0
            })

    avg_hours = round(total_hours_sum / max(1, len(logs)), 1) if logs else 0.0

    return {
        "date": today_str,
        "total_enrolled": len(all_students),
        "present_count": len(logs),
        "absent_count": len(all_students) - len(logs),
        "avg_hours": avg_hours,
        "roster": roster
    }


# ============================================================
# CHECKOUT / MARK DEPARTED ENDPOINT
# ============================================================

@app.post("/attendance/checkout")
async def checkout_student_attendance(student_id: str = Form(...)):
    today_str = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
    now_dt = datetime.now(ZoneInfo("Asia/Kolkata"))

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AttendanceLog).where(
                AttendanceLog.student_id == student_id,
                AttendanceLog.date_str == today_str
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="No active attendance check-in found for today.")

        record.last_seen_at = now_dt
        record.status = "DEPARTED"
        await session.commit()
        await session.refresh(record)

        duration_mins = int((record.last_seen_at - record.first_seen_at).total_seconds() / 60)
        hours = round(duration_mins / 60.0, 1)

        return {
            "success": True,
            "message": f"Student {student_id} marked as Departed.",
            "student_id": student_id,
            "check_in": record.first_seen_at.strftime("%I:%M %p"),
            "check_out": record.last_seen_at.strftime("%I:%M %p"),
            "total_hours": hours,
            "duration_minutes": duration_mins
        }


# ============================================================
# GENERAL DETECTION APIs
# ============================================================

@app.get("/detections")
async def get_detections():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(PhoneDetection)
            .order_by(
                PhoneDetection.id.desc()
            )
        )

        detections = result.scalars().all()

        return {
            "count": len(detections),
            "detections": [
                {
                    "id": detection.id,
                    "student_id": detection.student_id,
                    "object_name": detection.object_name,
                    "confidence": detection.confidence,
                    "evidence_path": detection.evidence_path,
                    "alert_sent": detection.alert_sent,
                    "created_at": (
                        detection.detected_at.isoformat()
                        if detection.detected_at
                        else None
                    )
                }
                for detection in detections
            ]
        }


# ============================================================
# STUDENT DETECTIONS
# ============================================================

@app.get(
    "/detections/student/{student_id}"
)
async def get_student_detections(
    student_id: str
):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(PhoneDetection)
            .where(
                PhoneDetection.student_id
                == student_id
            )
            .order_by(
                PhoneDetection.id.desc()
            )
        )

        detections = result.scalars().all()

        return {
            "student_id": student_id,
            "count": len(detections),
            "detections": [
                {
                    "id": detection.id,
                    "object_name": detection.object_name,
                    "confidence": detection.confidence,
                    "evidence_path": detection.evidence_path,
                    "alert_sent": detection.alert_sent,
                    "created_at": (
                        detection.detected_at.isoformat()
                        if detection.detected_at
                        else None
                    )
                }
                for detection in detections
            ]
        }


# ============================================================
# CREATE GENERAL DETECTION
# ============================================================

@app.post("/detections")
async def create_detection(
    detection_data: DetectionCreate
):

    async with AsyncSessionLocal() as session:

        detection = PhoneDetection(
            student_id=detection_data.student_id,
            object_name=detection_data.object_name,
            confidence=detection_data.confidence,
            detection_type=detection_data.detection_type,
            evidence_path=detection_data.evidence_path,
            alert_sent=False
        )

        session.add(detection)

        await session.commit()

        await session.refresh(detection)

        return {
            "success": True,
            "message": "Detection saved successfully",
            "detection": {
                "id": detection.id,
                "student_id": detection.student_id,
                "object_name": detection.object_name,
                "confidence": detection.confidence,
                "evidence_path": detection.evidence_path,
                "alert_sent": detection.alert_sent,
                "created_at": (
                    detection.detected_at.isoformat()
                    if detection.detected_at
                    else None
                )
            }
        }


# ============================================================
# PHONE DETECTION - GET
# ============================================================

@app.get("/phone-detections")
async def get_phone_detections():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(PhoneDetection)
            .order_by(
                PhoneDetection.id.desc()
            )
        )

        detections = result.scalars().all()

        return {
            "count": len(detections),
            "detections": [
                {
                    "id": detection.id,
                    "student_id": detection.student_id,
                    "object_name": detection.object_name,
                    "detection_type": detection.detection_type or "PHONE_VIOLATION",
                    "location": detection.location or "Main Camera",
                    "confidence": detection.confidence,
                    "evidence_path": detection.evidence_path,
                    "alert_sent": detection.alert_sent,
                    "created_at": (
                        detection.detected_at.isoformat()
                        if detection.detected_at
                        else None
                    )
                }
                for detection in detections
            ]
        }


# ============================================================
# PHONE DETECTION - POST
# ============================================================

@app.post("/phone-detections")
async def create_phone_detection(
    detection_data: PhoneDetectionCreate,
    background_tasks: BackgroundTasks
):

    async with AsyncSessionLocal() as session:

        # ----------------------------------------------------
        # Verify student exists or allow UNKNOWN visitor
        # ----------------------------------------------------

        student_id_val = detection_data.student_id or "UNKNOWN"

        if student_id_val.upper() != "UNKNOWN" and not student_id_val.upper().startswith("VISITOR"):
            result = await session.execute(
                select(Student).where(
                    Student.student_id == student_id_val
                )
            )
            student = result.scalar_one_or_none()
            if student is None:
                # If not found in DB, default to UNKNOWN visitor instead of failing
                student_id_val = "UNKNOWN"


        # ----------------------------------------------------
        # Create detection record
        # ----------------------------------------------------

        detection = PhoneDetection(

            student_id=student_id_val,

            object_name=(
                detection_data.object_name
            ),

            detection_type=(
                detection_data.detection_type
            ),
            
            location=(
                detection_data.location
            ),

            confidence=(
                detection_data.confidence
            ),

            evidence_path=(
                detection_data.evidence_path
            ),

            alert_sent=(
                detection_data.alert_sent
            )
        )


        session.add(detection)

        await session.commit()

        await session.refresh(
            detection
        )


        is_phone_viol = (detection.detection_type or "").upper() == "PHONE_VIOLATION"
        await update_attendance_record(detection.student_id, is_phone_viol)

        # Trigger Automated Email Notification
        if is_phone_viol:
            background_tasks.add_task(
                send_violation_email,
                student_id=detection.student_id,
                object_name=detection.object_name or "Phone",
                confidence=detection.confidence or 0.0,
                evidence_path=detection.evidence_path
            )

        det_dict = {
            "id": detection.id,
            "student_id": detection.student_id,
            "object_name": detection.object_name,
            "detection_type": detection.detection_type or "PHONE_VIOLATION",
            "location": detection.location or "Main Camera",
            "confidence": detection.confidence,
            "evidence_path": detection.evidence_path,
            "alert_sent": detection.alert_sent,
            "created_at": (
                detection.detected_at.isoformat()
                if detection.detected_at
                else None
            )
        }

        await manager.broadcast({"type": "NEW_DETECTION", "detection": det_dict})

        return {
            "success": True,
            "message": "Phone detection saved successfully",
            "detection": det_dict
        }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
async def dashboard():

    async with AsyncSessionLocal() as session:

        # ----------------------------------------------------
        # Total students
        # ----------------------------------------------------

        student_result = await session.execute(
            select(
                func.count(Student.id)
            )
        )

        total_students = (
            student_result.scalar()
            or 0
        )


        # ----------------------------------------------------
        # Total detections
        # ----------------------------------------------------

        detection_result = await session.execute(
            select(
                func.count(
                    PhoneDetection.id
                )
            )
        )

        total_detections = (
            detection_result.scalar()
            or 0
        )


        # ----------------------------------------------------
        # Telemetry Metrics Breakdown
        # ----------------------------------------------------

        # Registered Phone Violations
        rpv_res = await session.execute(
            select(func.count(PhoneDetection.id)).where(
                func.upper(PhoneDetection.student_id) != "UNKNOWN",
                PhoneDetection.detection_type == "PHONE_VIOLATION"
            )
        )
        reg_phone_violations = rpv_res.scalar() or 0

        # Registered Face Entries / Check-ins
        rfe_res = await session.execute(
            select(func.count(PhoneDetection.id)).where(
                func.upper(PhoneDetection.student_id) != "UNKNOWN",
                PhoneDetection.detection_type == "FACE_PRESENCE"
            )
        )
        reg_face_entries = rfe_res.scalar() or 0

        # Unregistered Visitor Phone Alerts
        upv_res = await session.execute(
            select(func.count(PhoneDetection.id)).where(
                func.upper(PhoneDetection.student_id) == "UNKNOWN",
                PhoneDetection.detection_type == "PHONE_VIOLATION"
            )
        )
        unreg_phone_violations = upv_res.scalar() or 0

        # Unregistered Visitor Face Entries
        ufe_res = await session.execute(
            select(func.count(PhoneDetection.id)).where(
                func.upper(PhoneDetection.student_id) == "UNKNOWN",
                PhoneDetection.detection_type == "FACE_PRESENCE"
            )
        )
        unreg_face_entries = ufe_res.scalar() or 0

        phone_detections = reg_phone_violations + unreg_phone_violations

        return {
            "total_students": total_students,
            "total_detections": total_detections,
            "phone_detections": phone_detections,
            "reg_phone_violations": reg_phone_violations,
            "reg_face_entries": reg_face_entries,
            "unreg_phone_violations": unreg_phone_violations,
            "unreg_face_entries": unreg_face_entries,
            "registered_detections": reg_phone_violations + reg_face_entries,
            "unregistered_detections": unreg_phone_violations + unreg_face_entries,
            "system_status": "active"
        }


# ============================================================
# STUDENT SESSION - START
# ============================================================

@app.post("/sessions/start")
async def start_session(
    session_data: SessionCreate
):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).where(
                Student.student_id
                == session_data.student_id
            )
        )

        student = result.scalar_one_or_none()


        if student is None:

            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )


        return {

            "success": True,

            "message": (
                "Student monitoring "
                "session started"
            ),

            "student": {

                "student_id":
                    student.student_id,

                "name":
                    student.name
            },

            "started_at":
                datetime.now().isoformat()
        }


# ============================================================
# STUDENT SESSION - STOP
# ============================================================

@app.post("/sessions/stop")
async def stop_session(
    session_data: SessionCreate
):

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).where(
                Student.student_id
                == session_data.student_id
            )
        )

        student = result.scalar_one_or_none()


        if student is None:

            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )


        return {

            "success": True,

            "message": (
                "Student monitoring "
                "session stopped"
            ),

            "student": {

                "student_id":
                    student.student_id,

                "name":
                    student.name
            },

            "stopped_at":
                datetime.now().isoformat()
        }


# ============================================================
# EVIDENCE STATUS
# ============================================================

@app.get("/evidence/status")
async def evidence_status():

    files = []


    if EVIDENCE_DIR.exists():

        for file in EVIDENCE_DIR.iterdir():

            if file.is_file():

                files.append({

                    "filename":
                        file.name,

                    "url":
                        f"/evidence/{file.name}",
                        
                    "created_at":
                        file.stat().st_mtime
                })
        
        # Sort files by created_at in ascending order so that frontend reverse() makes newest first
        files.sort(key=lambda x: x["created_at"])


    return {

        "count":
            len(files),

        "evidence_directory":
            str(EVIDENCE_DIR),

        "files":
            files
    }


# ============================================================
# ANALYTICS ENDPOINTS
# ============================================================

from datetime import timedelta

@app.get("/analytics/summary")
async def get_analytics_summary():
    async with AsyncSessionLocal() as session:
        total_students_res = await session.execute(select(func.count(Student.id)))
        total_students = total_students_res.scalar() or 0
        
        today_date_str = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
        
        today_checkins_res = await session.execute(
            select(func.count(AttendanceLog.id)).where(AttendanceLog.date_str == today_date_str)
        )
        today_checkins = today_checkins_res.scalar() or 0
        
        today_violations_res = await session.execute(
            select(func.sum(AttendanceLog.violation_count)).where(AttendanceLog.date_str == today_date_str)
        )
        today_violations = today_violations_res.scalar() or 0
        
        return {
            "total_students": total_students,
            "today_checkins": today_checkins,
            "today_violations": today_violations
        }

@app.get("/analytics/trends")
async def get_analytics_trends():
    async with AsyncSessionLocal() as session:
        # Generate last 7 days
        days = []
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        for i in range(6, -1, -1):
            d = now - timedelta(days=i)
            days.append(d.strftime("%Y-%m-%d"))
            
        trends = []
        for d in days:
            ch_res = await session.execute(select(func.count(AttendanceLog.id)).where(AttendanceLog.date_str == d))
            vi_res = await session.execute(select(func.sum(AttendanceLog.violation_count)).where(AttendanceLog.date_str == d))
            
            trends.append({
                "date": d,
                "checkins": ch_res.scalar() or 0,
                "violations": vi_res.scalar() or 0
            })
            
        return {"trends": trends}

@app.get("/analytics/export")
async def export_analytics_csv():
    async with AsyncSessionLocal() as session:
        logs_res = await session.execute(select(AttendanceLog).order_by(AttendanceLog.first_seen_at.desc()))
        logs = logs_res.scalars().all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["Date", "Student ID", "Status", "First Seen At", "Last Seen At", "Violations"])
        for log in logs:
            writer.writerow([
                log.date_str,
                log.student_id,
                log.status,
                log.first_seen_at.strftime("%Y-%m-%d %H:%M:%S") if log.first_seen_at else "",
                log.last_seen_at.strftime("%Y-%m-%d %H:%M:%S") if log.last_seen_at else "",
                log.violation_count
            ])
            
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=attendance_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )


# ============================================================
# SUBJECTS MODULE ENDPOINTS
# ============================================================

from sqlalchemy.orm import selectinload

@app.get("/api/departments")
async def get_departments():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Department).where(Department.is_active == True))
        depts = result.scalars().all()
        return {
            "departments": [{"id": d.id, "name": d.name, "code": d.code, "plan": d.plan} for d in depts]
        }

@app.get("/api/departments/{dept_id}/curriculum")
async def get_department_curriculum(dept_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Curriculum).where(Curriculum.department_id == dept_id).order_by(Curriculum.batch_year.desc())
        )
        curriculums = result.scalars().all()
        return {
            "curriculums": [
                {
                    "id": c.id, 
                    "batch_year": c.batch_year, 
                    "program_name": c.program_name
                } for c in curriculums
            ]
        }

@app.get("/api/curriculum/{curriculum_id}/subjects")
async def get_curriculum_subjects(curriculum_id: int):
    async with AsyncSessionLocal() as session:
        # Load semesters without relationships
        result = await session.execute(
            select(Semester)
            .where(Semester.curriculum_id == curriculum_id)
            .order_by(Semester.number)
        )
        semesters = result.scalars().all()
        
        sem_data = []
        for sem in semesters:
            # Query subjects
            sub_res = await session.execute(select(Subject).where(Subject.semester_id == sem.id))
            subjects = sub_res.scalars().all()
            
            subjects_data = []
            for sub in subjects:
                subjects_data.append({
                    "id": sub.id,
                    "code": sub.course_code,
                    "name": sub.course_name,
                    "l": sub.l,
                    "t": sub.t,
                    "p": sub.p,
                    "cia": sub.cia_marks,
                    "tee": sub.tee_marks,
                    "total": sub.total_marks,
                    "credits": sub.credits,
                    "type": sub.course_type,
                    "is_elective_group": sub.is_elective_group,
                    "elective_group_id": sub.elective_group_id
                })
                
            # Query elective groups
            eg_res = await session.execute(select(ElectiveGroup).where(ElectiveGroup.semester_id == sem.id))
            elective_groups = eg_res.scalars().all()
            
            elective_groups_data = []
            for eg in elective_groups:
                opt_res = await session.execute(select(ElectiveOption).where(ElectiveOption.elective_group_id == eg.id))
                options = opt_res.scalars().all()
                elective_groups_data.append({
                    "id": eg.id,
                    "code": eg.group_code,
                    "title": eg.group_title,
                    "options": [{"id": opt.id, "label": opt.option_label, "name": opt.subject_name} for opt in options]
                })

            # Dynamically calculate totals
            calc_total_l = sum(s["l"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_t = sum(s["t"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_p = sum(s["p"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_cia = sum(s["cia"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_tee = sum(s["tee"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_marks = sum(s["total"] for s in subjects_data if not s.get("is_elective_group"))
            calc_total_credits = sum(s["credits"] for s in subjects_data if not s.get("is_elective_group"))
            
            # Add elective group totals
            for eg in elective_groups_data:
                eg_sub = next((s for s in subjects_data if s["code"] == eg["code"]), None)
                if eg_sub:
                    calc_total_l += eg_sub["l"]
                    calc_total_t += eg_sub["t"]
                    calc_total_p += eg_sub["p"]
                    calc_total_cia += eg_sub["cia"]
                    calc_total_tee += eg_sub["tee"]
                    calc_total_marks += eg_sub["total"]
                    calc_total_credits += eg_sub["credits"]

            sem_data.append({
                "id": sem.id,
                "number": sem.number,
                "total_l": calc_total_l,
                "total_t": calc_total_t,
                "total_p": calc_total_p,
                "total_cia": calc_total_cia,
                "total_tee": calc_total_tee,
                "total_marks": calc_total_marks,
                "total_credits": calc_total_credits,
                "subjects": subjects_data,
                "elective_groups": elective_groups_data
            })
            
        return {"semesters": sem_data}

@app.post("/api/departments", status_code=201)
async def create_department(dept_data: DepartmentCreate):
    async with AsyncSessionLocal() as session:
        new_dept = Department(**dept_data.dict())
        session.add(new_dept)
        await session.commit()
        await session.refresh(new_dept)
        return new_dept

@app.delete("/api/departments/{dept_id}", status_code=204)
async def delete_department(dept_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Department).where(Department.id == dept_id))
        dept = result.scalar_one_or_none()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        
        # SQLAlchemy doesn't have FK constraints enabled in sqlite by default unless PRAGMA foreign_keys=ON
        # We will delete the department record.
        await session.delete(dept)
        await session.commit()
        return None

@app.post("/api/departments/{dept_id}/curriculum", status_code=201)
async def create_curriculum(dept_id: int, curr_data: CurriculumCreate):
    async with AsyncSessionLocal() as session:
        new_curr = Curriculum(
            batch_year=curr_data.batch_year, 
            program_name=curr_data.program_name, 
            department_id=dept_id
        )
        session.add(new_curr)
        await session.flush() # flush to get new_curr.id
        
        # Auto-generate semesters
        for i in range(1, curr_data.total_semesters + 1):
            new_sem = Semester(number=i, curriculum_id=new_curr.id)
            session.add(new_sem)
            
        await session.commit()
        await session.refresh(new_curr)
        return new_curr

@app.post("/api/curriculum/{curriculum_id}/semesters", status_code=201)
async def create_semester(curriculum_id: int, sem_data: SemesterCreate):
    async with AsyncSessionLocal() as session:
        new_sem = Semester(**sem_data.dict(), curriculum_id=curriculum_id)
        session.add(new_sem)
        await session.commit()
        await session.refresh(new_sem)
        return new_sem

@app.post("/api/subjects", status_code=201)
async def create_subject(subject_data: SubjectCreate):
    async with AsyncSessionLocal() as session:
        new_subject = Subject(**subject_data.dict())
        session.add(new_subject)
        await session.commit()
        await session.refresh(new_subject)
        return new_subject

@app.patch("/api/subjects/{subject_id}")
async def update_subject(subject_id: int, subject_data: SubjectUpdate):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        update_data = subject_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(subject, key, value)
            
        await session.commit()
        await session.refresh(subject)
        return subject

@app.delete("/api/subjects/{subject_id}")
async def delete_subject(subject_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        await session.delete(subject)
        await session.commit()
        return {"message": "Subject deleted successfully"}

# ============================================================
# STATIC EVIDENCE FILES (Mounted after explicit API routes)
# ============================================================

app.mount(
    "/evidence",
    StaticFiles(
        directory=str(EVIDENCE_DIR)
    ),
    name="evidence"
)

app.mount(
    "/student-faces",
    StaticFiles(
        directory=str(STUDENT_FACES_DIR)
    ),
    name="student_faces"
)

app.mount(
    "/dashboard",
    StaticFiles(
        directory=str(DASHBOARD_DIR),
        html=True
    ),
    name="dashboard"
)


# ============================================================
# APPLICATION END
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )