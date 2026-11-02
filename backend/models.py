from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import String, Integer, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True
    )


class PhoneDetection(Base):
    __tablename__ = "phone_detections"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id: Mapped[str | None] = mapped_column(
        
        String(50),
        nullable=True,
        index=True
    )

    object_name: Mapped[str] = mapped_column(
        String(50),
        default="cell phone"
    )

    detection_type: Mapped[str] = mapped_column(
        String(50),
        default="PHONE_VIOLATION"
    )

    location: Mapped[str] = mapped_column(
        String(100),
        default="Main Camera"
    )

    confidence: Mapped[float] = mapped_column(
        Float
    )

    detected_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(
            ZoneInfo("Asia/Kolkata")
        )
    )

    evidence_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    alert_sent: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id: Mapped[str] = mapped_column(
        String(50),
        index=True
    )

    date_str: Mapped[str] = mapped_column(
        String(20),
        index=True
    )

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(ZoneInfo("Asia/Kolkata"))
    )

    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(ZoneInfo("Asia/Kolkata"))
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="PRESENT"
    )

    violation_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )


class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(20), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")

class Curriculum(Base):
    __tablename__ = "curriculums"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    department_id: Mapped[int] = mapped_column(Integer)
    batch_year: Mapped[int] = mapped_column(Integer)
    program_name: Mapped[str] = mapped_column(String(100))
    total_credits: Mapped[float] = mapped_column(Float, default=0.0)
    total_marks: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Semester(Base):
    __tablename__ = "semesters"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    curriculum_id: Mapped[int] = mapped_column(Integer)
    number: Mapped[int] = mapped_column(Integer)
    total_l: Mapped[int] = mapped_column(Integer, default=0)
    total_t: Mapped[int] = mapped_column(Integer, default=0)
    total_p: Mapped[int] = mapped_column(Integer, default=0)
    total_cia: Mapped[int] = mapped_column(Integer, default=0)
    total_tee: Mapped[int] = mapped_column(Integer, default=0)
    total_marks: Mapped[int] = mapped_column(Integer, default=0)
    total_credits: Mapped[float] = mapped_column(Float, default=0.0)

class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    semester_id: Mapped[int] = mapped_column(Integer)
    course_code: Mapped[str] = mapped_column(String(50))
    course_name: Mapped[str] = mapped_column(String(200))
    l: Mapped[int] = mapped_column(Integer, default=0)
    t: Mapped[int] = mapped_column(Integer, default=0)
    p: Mapped[int] = mapped_column(Integer, default=0)
    cia_marks: Mapped[int] = mapped_column(Integer, default=0)
    tee_marks: Mapped[int] = mapped_column(Integer, default=0)
    total_marks: Mapped[int] = mapped_column(Integer, default=0)
    credits: Mapped[float] = mapped_column(Float, default=0.0)
    course_type: Mapped[str] = mapped_column(String(20))
    is_elective_group: Mapped[bool] = mapped_column(Boolean, default=False)
    elective_group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

class ElectiveGroup(Base):
    __tablename__ = "elective_groups"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    semester_id: Mapped[int] = mapped_column(Integer)
    group_code: Mapped[str] = mapped_column(String(50))
    group_title: Mapped[str] = mapped_column(String(200))

class ElectiveOption(Base):
    __tablename__ = "elective_options"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    elective_group_id: Mapped[int] = mapped_column(Integer)
    option_label: Mapped[str] = mapped_column(String(10))
    subject_name: Mapped[str] = mapped_column(String(200))
