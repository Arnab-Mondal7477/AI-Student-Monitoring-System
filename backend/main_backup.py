from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func

from database import engine, AsyncSessionLocal, Base
from models import Student, PhoneDetection


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

EVIDENCE_DIR = BASE_DIR / "evidence"
STUDENT_FACES_DIR = BASE_DIR / "student_faces"

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
# STATIC EVIDENCE FILES
# ============================================================

app.mount(
    "/evidence",
    StaticFiles(
        directory=str(EVIDENCE_DIR)
    ),
    name="evidence"
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
    evidence_path: str | None = None


class PhoneDetectionCreate(BaseModel):

    student_id: str
    object_name: str = "cell phone"
    confidence: float
    evidence_path: str | None = None
    alert_sent: bool = False


class SessionCreate(BaseModel):

    student_id: str


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

    return {
        "status": "healthy",
        "database": "connected",
        "ai_engine": "YOLO11",
        "time": datetime.now().isoformat()
    }


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
                    "email": student.email
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

        return {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email
        }


# ============================================================
# CREATE STUDENT
# ============================================================

@app.post("/students")
async def create_student(
    student_data: StudentCreate
):

    async with AsyncSessionLocal() as session:

        # Check duplicate student ID

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


        # Create student

        student = Student(
            student_id=student_data.student_id,
            name=student_data.name,
            email=student_data.email
        )

        session.add(student)

        await session.commit()

        await session.refresh(student)


        # Create face folder

        student_folder = (
            STUDENT_FACES_DIR
            / student.student_id
        )

        student_folder.mkdir(
            parents=True,
            exist_ok=True
        )


        return {
            "success": True,
            "message": "Student created successfully",
            "student": {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email
            }
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
            .where(
                func.lower(
                    PhoneDetection.object_name
                ) == "cell phone"
            )
            .order_by(
                PhoneDetection.id.desc()
            )
        )

        detections = result.scalars().all()

        return {
            "object": "cell phone",
            "count": len(detections),
            "detections": [
                {
                    "id": detection.id,
                    "student_id": detection.student_id,
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
    detection_data: PhoneDetectionCreate
):

    async with AsyncSessionLocal() as session:

        # ----------------------------------------------------
        # Verify student exists
        # ----------------------------------------------------

        result = await session.execute(
            select(Student).where(
                Student.student_id
                == detection_data.student_id
            )
        )

        student = result.scalar_one_or_none()


        if student is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Student "
                    f"{detection_data.student_id} "
                    f"not found"
                )
            )


        # ----------------------------------------------------
        # Create phone detection
        # ----------------------------------------------------

        detection = PhoneDetection(

            student_id=(
                detection_data.student_id
            ),

            object_name=(
                detection_data.object_name
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


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {

            "success": True,

            "message": (
                "Phone detection "
                "saved successfully"
            ),

            "detection": {

                "id": detection.id,

                "student_id": (
                    detection.student_id
                ),

                "object_name": (
                    detection.object_name
                ),

                "confidence": (
                    detection.confidence
                ),

                "evidence_path": (
                    detection.evidence_path
                ),

                "alert_sent": (
                    detection.alert_sent
                ),

                "created_at": (
                    detection.detected_at.isoformat()
                    if detection.detected_at
                    else None
                )
            }
        }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/dashboard")
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
        # Phone detections
        # ----------------------------------------------------

        phone_result = await session.execute(
            select(
                func.count(
                    PhoneDetection.id
                )
            ).where(
                func.lower(
                    PhoneDetection.object_name
                ) == "cell phone"
            )
        )

        phone_detections = (
            phone_result.scalar()
            or 0
        )


        return {

            "total_students":
                total_students,

            "total_detections":
                total_detections,

            "phone_detections":
                phone_detections,

            "system_status":
                "active"
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
                        f"/evidence/{file.name}"
                })


    return {

        "count":
            len(files),

        "evidence_directory":
            str(EVIDENCE_DIR),

        "files":
            files
    }


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