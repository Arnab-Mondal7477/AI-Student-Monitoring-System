import asyncio

from database import AsyncSessionLocal
from models import Student
from sqlalchemy import select


async def main():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Student).where(
                Student.student_id == "string"
            )
        )

        student = result.scalar_one_or_none()

        if student:

            await session.delete(student)
            await session.commit()

            print("✅ Dummy student 'string' deleted.")

        else:

            print("ℹ️ Dummy student not found.")


asyncio.run(main())
