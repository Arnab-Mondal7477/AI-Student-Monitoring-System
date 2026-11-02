import asyncio

from database import AsyncSessionLocal
from models import Student
from sqlalchemy import select


async def main():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).order_by(Student.id)
        )

        students = result.scalars().all()

        print()
        print("==============================")
        print(" REGISTERED STUDENTS")
        print("==============================")

        if not students:

            print("No students registered.")

        else:

            for student in students:

                print(
                    f"ID: {student.student_id} | "
                    f"Name: {student.name} | "
                    f"Email: {student.email}"
                )

        print("==============================")
        print()


asyncio.run(main())
