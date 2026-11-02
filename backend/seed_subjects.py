import os
import sys
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import engine, Base, AsyncSessionLocal
from models import Department, Curriculum, Semester, Subject, ElectiveGroup, ElectiveOption

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Create department
        result = await session.execute(select(Department).filter_by(code="CSE"))
        dept = result.scalars().first()
        if not dept:
            dept = Department(name="Computer Science & Engineering", code="CSE", plan="premium")
            session.add(dept)
            await session.commit()
            await session.refresh(dept)

        # Create curriculum
        result = await session.execute(select(Curriculum).filter_by(department_id=dept.id, batch_year=2024))
        curr = result.scalars().first()
        if not curr:
            curr = Curriculum(
                department_id=dept.id, 
                batch_year=2024, 
                program_name="B.Tech Computer Science",
                total_credits=162.0,
                total_marks=5700
            )
            session.add(curr)
            await session.commit()
            await session.refresh(curr)

        # Helper to create semester and subjects
        async def add_semester(num, t_l, t_t, t_p, t_cia, t_tee, t_marks, t_credits, subjects, elective_groups=None):
            if elective_groups is None:
                elective_groups = []
            result = await session.execute(select(Semester).filter_by(curriculum_id=curr.id, number=num))
            sem = result.scalars().first()
            if not sem:
                sem = Semester(
                    curriculum_id=curr.id, number=num, total_l=t_l, total_t=t_t, total_p=t_p,
                    total_cia=t_cia, total_tee=t_tee, total_marks=t_marks, total_credits=t_credits
                )
                session.add(sem)
                await session.commit()
                await session.refresh(sem)

            # Add subjects
            for sub in subjects:
                result = await session.execute(select(Subject).filter_by(semester_id=sem.id, course_code=sub['code']))
                existing_sub = result.scalars().first()
                if not existing_sub:
                    new_sub = Subject(
                        semester_id=sem.id, course_code=sub['code'], course_name=sub['name'],
                        l=sub['l'], t=sub['t'], p=sub['p'], cia_marks=sub['cia'], tee_marks=sub['tee'],
                        total_marks=sub['total'], credits=sub['credits'], course_type=sub['type'],
                        is_elective_group=sub.get('is_elective', False)
                    )
                    session.add(new_sub)
            await session.commit()

            # Add elective groups and options
            for eg in elective_groups:
                result = await session.execute(select(ElectiveGroup).filter_by(semester_id=sem.id, group_code=eg['code']))
                group = result.scalars().first()
                if not group:
                    group = ElectiveGroup(semester_id=sem.id, group_code=eg['code'], group_title=eg['title'])
                    session.add(group)
                    await session.commit()
                    await session.refresh(group)
                    
                    # Update subject with elective_group_id
                    result = await session.execute(select(Subject).filter_by(semester_id=sem.id, course_code=eg['code']))
                    subj_to_update = result.scalars().first()
                    if subj_to_update:
                        subj_to_update.elective_group_id = group.id
                        await session.commit()

                    for opt in eg['options']:
                        result = await session.execute(select(ElectiveOption).filter_by(elective_group_id=group.id, option_label=opt['label']))
                        new_opt = result.scalars().first()
                        if not new_opt:
                            new_opt = ElectiveOption(elective_group_id=group.id, option_label=opt['label'], subject_name=opt['name'])
                            session.add(new_opt)
            await session.commit()

        # SEMESTER I
        await add_semester(1, 16, 2, 7, 320, 480, 800, 19.5, [
            {'code': 'BHS00001', 'name': 'English for Technical Communication', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'HSMC'},
            {'code': 'BHS00004', 'name': 'Understanding Harmony and Ethical Human Conduct', 'l':2, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':2, 'type':'HSMC'},
            {'code': 'BBS00010', 'name': 'Engineering Chemistry', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'BSC'},
            {'code': 'BBS00005', 'name': 'Calculus', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'BSC'},
            {'code': 'BES00006', 'name': 'Programming for Problem Solving', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'ESC'},
            {'code': 'BBS09020', 'name': 'Engineering Chemistry Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'BSC'},
            {'code': 'BES09012', 'name': 'Programming for Problem Solving Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'ESC'},
            {'code': 'BES09015', 'name': 'Workshop and Manufacturing Practices', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'ESC'},
            {'code': 'BAU00002', 'name': 'Environmental Sciences', 'l':2, 't':0, 'p':0, 'cia':0, 'tee':0, 'total':0, 'credits':0, 'type':'AUC'}
        ])

        # SEMESTER II
        await add_semester(2, 16, 2, 11, 320, 480, 800, 21.5, [
            {'code': 'BHS07008', 'name': 'Effective Communication and Soft Skills', 'l':2, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'HSMC'},
            {'code': 'BBS00015', 'name': 'Semiconductor Physics', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'BSC'},
            {'code': 'BBS00002', 'name': 'Algebra and Vector Calculus', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'BSC'},
            {'code': 'BES00002', 'name': 'Basic Electrical and Electronics Engineering', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'ESC'},
            {'code': 'BES07010', 'name': 'Data Structure and Algorithms', 'l':3, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'ESC'},
            {'code': 'BBS09022', 'name': 'Semiconductor Physics Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'BSC'},
            {'code': 'BES09008', 'name': 'Basic Electrical and Electronics Engineering Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'ESC'},
            {'code': 'BES09014', 'name': 'Engineering Graphics and Design Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'ESC'},
            {'code': 'BAU00004', 'name': 'Yoga and Sports', 'l':2, 't':0, 'p':0, 'cia':0, 'tee':0, 'total':0, 'credits':0, 'type':'AUC'}
        ])

        # SEMESTER III
        await add_semester(3, 14, 3, 6, 280, 420, 700, 18, [
            {'code': 'BBS00014', 'name': 'Probability and Statistics', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'BSC'},
            {'code': 'BES00007', 'name': 'Python Programming', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'ESC'},
            {'code': 'BTS30101', 'name': 'Computer Organization and Architecture', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS30102', 'name': 'Database Management Systems', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BES09013', 'name': 'Python Programming Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'ESC'},
            {'code': 'BTS39103', 'name': 'Computer Organization and Architecture Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'PCC'},
            {'code': 'BTS39104', 'name': 'Database Management Systems Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'PCC'},
            {'code': 'BAU00001', 'name': 'Constitution of India', 'l':2, 't':0, 'p':0, 'cia':0, 'tee':0, 'total':0, 'credits':0, 'type':'AUC'}
        ])

        # SEMESTER IV
        await add_semester(4, 18, 0, 9, 360, 540, 900, 22.5, [
            {'code': 'BHS00005', 'name': 'Design Thinking for Entrepreneurship and Startups', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'HSMC'},
            {'code': 'BBS00008', 'name': 'Discrete Mathematics', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'BSC'},
            {'code': 'BTS40105', 'name': 'Operating Systems', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PCC'},
            {'code': 'BTS40106', 'name': 'Design and Analysis of Algorithms', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PCC'},
            {'code': 'BTS40107', 'name': 'Object Oriented Programming', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PCC'},
            {'code': 'BTS40108', 'name': 'Formal Language and Automata Theory', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PCC'},
            {'code': 'BTS49109', 'name': 'Operating Systems Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'},
            {'code': 'BTS49110', 'name': 'Design and Analysis of Algorithms Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'},
            {'code': 'BTS49111', 'name': 'Object Oriented Programming Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'}
        ])

        # SEMESTER V
        await add_semester(5, 13, 3, 10, 320, 480, 800, 21, [
            {'code': 'BTS50112', 'name': 'Computer Networks', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS50113', 'name': 'Distributed System', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS50114', 'name': 'Compiler Design', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS50115', 'name': 'Professional Ethics', 'l':2, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':2, 'type':'PCC'},
            {'code': 'BTS57201', 'name': 'Professional Elective Course - I', 'l':2, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PEC', 'is_elective': True},
            {'code': 'BTS59116', 'name': 'Computer Networks Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'PCC'},
            {'code': 'BTS59117', 'name': 'Distributed System Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'},
            {'code': 'BTS59118', 'name': 'Compiler Design Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'}
        ], [
            {
                'code': 'BTS57201', 'title': 'Professional Elective Course - I',
                'options': [
                    {'label': 'A', 'name': 'Artificial Intelligence'},
                    {'label': 'B', 'name': 'Image Processing'},
                    {'label': 'C', 'name': 'Cloud Computing'}
                ]
            }
        ])

        # SEMESTER VI
        await add_semester(6, 14, 2, 7, 280, 420, 700, 19.5, [
            {'code': 'BTS60119', 'name': 'Machine Learning', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS60120', 'name': 'Data Mining and Data Warehousing', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PCC'},
            {'code': 'BTS60121', 'name': 'Internet of Things', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS67202', 'name': 'Professional Elective Course - II', 'l':2, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PEC', 'is_elective': True},
            {'code': 'BTS60301', 'name': 'Open Elective Course - I', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'OEC', 'is_elective': True},
            {'code': 'BTS69122', 'name': 'Machine Learning Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'PCC'},
            {'code': 'BTS69123', 'name': 'Data Mining and Data Warehousing Lab', 'l':0, 't':0, 'p':3, 'cia':40, 'tee':60, 'total':100, 'credits':1.5, 'type':'PCC'}
        ], [
            {
                'code': 'BTS67202', 'title': 'Professional Elective Course - II',
                'options': [
                    {'label': 'A', 'name': 'Big Data and Analytics'},
                    {'label': 'B', 'name': 'Soft Computing'},
                    {'label': 'C', 'name': 'Deep Learning'}
                ]
            },
            {
                'code': 'BTS60301', 'title': 'Open Elective Course - I',
                'options': [
                    {'label': 'A', 'name': 'Software Project Management'},
                    {'label': 'B', 'name': 'Organisational Behaviour'},
                    {'label': 'C', 'name': 'MOOC'}
                ]
            }
        ])

        # SEMESTER VII
        await add_semester(7, 14, 2, 4, 320, 480, 800, 24, [
            {'code': 'BTS70124', 'name': 'Software Engineering', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS70125', 'name': 'System Software and Administration', 'l':3, 't':1, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PCC'},
            {'code': 'BTS77203', 'name': 'Professional Elective Course - III', 'l':2, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'PEC', 'is_elective': True},
            {'code': 'BTS70302', 'name': 'Open Elective Course - II', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'OEC', 'is_elective': True},
            {'code': 'BTS70303', 'name': 'Open Elective Course - III', 'l':3, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':3, 'type':'OEC', 'is_elective': True},
            {'code': 'BTS79126', 'name': 'Software Tools and Techniques Lab', 'l':0, 't':0, 'p':2, 'cia':40, 'tee':60, 'total':100, 'credits':1, 'type':'PCC'},
            {'code': 'BTS78101', 'name': 'Industrial Training', 'l':0, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':2, 'type':'PROJ'},
            {'code': 'BTS78102', 'name': 'Project - I', 'l':0, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PROJ'}
        ], [
            {
                'code': 'BTS77203', 'title': 'Professional Elective Course - III',
                'options': [
                    {'label': 'A', 'name': 'Data and Internet Security'},
                    {'label': 'B', 'name': 'Quantum Computing'},
                    {'label': 'C', 'name': 'Pattern Recognition'}
                ]
            },
            {
                'code': 'BTS70302', 'title': 'Open Elective Course - II',
                'options': [
                    {'label': 'A', 'name': 'Entrepreneurship Basics'},
                    {'label': 'B', 'name': 'Cyber Law and Ethics'},
                    {'label': 'C', 'name': 'MOOC'}
                ]
            },
            {
                'code': 'BTS70303', 'title': 'Open Elective Course - III',
                'options': [
                    {'label': 'A', 'name': 'Financial Management'},
                    {'label': 'B', 'name': 'Engineering Economics'},
                    {'label': 'C', 'name': 'MOOC'}
                ]
            }
        ])

        # SEMESTER VIII
        await add_semester(8, 0, 0, 0, 80, 120, 200, 16, [
            {'code': 'BTS88103', 'name': 'Project - II', 'l':0, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':12, 'type':'PROJ'},
            {'code': 'BTS88104', 'name': 'Grand Viva - Voce', 'l':0, 't':0, 'p':0, 'cia':40, 'tee':60, 'total':100, 'credits':4, 'type':'PROJ'}
        ])

async def main():
    print("Initializing Database...")
    await init_db()
    print("Seeding subjects and curriculums...")
    await seed_data()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
