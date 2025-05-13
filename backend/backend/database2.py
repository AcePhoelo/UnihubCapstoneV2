import os
import django
import sys
import re
from django.db import models

# Add the project root to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from clubs.models import Club, ClubMembership
from user_profile.models import Student
from django.contrib.auth.hashers import make_password
from django.db import transaction, connection
from django.db.models.signals import post_save

def create_students(student_data):
    """
    Create users and student profiles from a list of student data.
    """
    created_students = []
    
    # Temporarily disable the post_save signal that's causing conflicts
    from user_profile.signals import create_or_update_student_profile
    post_save.disconnect(create_or_update_student_profile, sender=User)
    
    for student in student_data:
        try:
            with transaction.atomic():
                student_id = student['id']
                # Clean the name of any invisible characters
                full_name = re.sub(r'[\u200B-\u200D\uFEFF]', '', student['name'])
                
                # Parse name parts - ensure no empty parts
                name_parts = [part for part in full_name.split() if part]
                first_name = name_parts[0] if name_parts else ""
                
                # Handle last name
                if len(name_parts) > 2:  # Has middle name
                    last_name = name_parts[-1]
                else:  # Just first and last name
                    last_name = name_parts[-1] if len(name_parts) > 1 else ""
                
                # Generate password
                password = student.get('password', f"{first_name}+Capstone")
                email = f"{student_id}@student.curtin.edu.au"
                
                # Create the user
                user, created = User.objects.get_or_create(
                    username=student_id,
                    defaults={
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": email,
                        "is_active": True,
                        "password": make_password(password),
                    }
                )
                
                # Extract numeric ID
                numeric_id = int(student_id)
                
                # Check if student profile exists
                student_obj = Student.objects.filter(user=user).first()
                
                # If student profile exists but ID doesn't match, fix it
                if student_obj and student_obj.id != numeric_id:
                    old_id = student_obj.id
                    
                    # Update references in other models
                    Club.objects.filter(president_id=old_id).update(president_id=None)
                    ClubMembership.objects.filter(student_id=old_id).delete()
                    
                    # Delete the old student record
                    student_obj.delete()
                    student_obj = None
                
                # Create student profile if needed directly using raw SQL
                if not student_obj:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            """
                            INSERT INTO user_profile_student 
                            (id, user_id, full_name, email, studentid, profile_picture)
                            VALUES (%s, %s, %s, %s, %s, NULL)
                            """,
                            [numeric_id, user.id, full_name, email, student_id]
                        )
                    
                    # Fetch the created object
                    student_obj = Student.objects.get(id=numeric_id)
                
                created_students.append(student_obj)
                print(f"Created/updated student: {full_name} ({student_id})")
        except Exception as e:
            print(f"Error creating student {student.get('name')}: {str(e)}")
    
    # Reconnect the signal
    post_save.connect(create_or_update_student_profile, sender=User)
    
    return created_students

if __name__ == "__main__":
    # Example student data
    students = [
        # Curtin Board Game Club
        {'name': 'Hans Hartowidjojo', 'id': '21449723'},
        {'name': 'Kenzo Yeo', 'id': '21714670'},
        {'name': 'Muhamad Shahul Hameed bin Mohamed Thair', 'id': '21629004'},
        {'name': 'Clarissa Adeliawanti', 'id': '21610778'},
        {'name': 'Yessica Nadya Danusaputro', 'id': '21871261'},
        {'name': 'Steven Widjaja', 'id': '20850609'},
        {'name': 'Nathan Teruna', 'id': '21708165'},
        {'name': 'Michelle Koh Hui Ching', 'id': '21361322'},
        {'name': 'Gregorius Arvindra Prasetyo', 'id': '21832556'},
        {'name': 'Noah Emmanuel Tristan', 'id': '21917372'},
        # Community Service Club
        {'name': 'Stella Sutanto', 'id': '22712439'},
        {'name': 'Navena S Suresh', 'id': '20673437'},
        {'name': 'Zaifa Niyaz', 'id': '21073614'},
        {'name': 'Evangeline Tanoto', 'id': '21716304'},
        {'name': 'Gabrielle Eugenia', 'id': '21904442'},
        {'name': 'Sarah Barry', 'id': '21691744'},
        {'name': 'Viktoriia Kudelina', 'id': '21739699'},
        {'name': 'Jiale Chen', 'id': '21650596'},
        {'name': 'Virginia Frilly Analda Changir', 'id': '21960839'},
        {'name': 'Hou Hon U', 'id': '21857274'},
        # KUNCI Club (change their IDs)
        {'name': 'Trisia Jasmine', 'id': '21759244'},
        {'name': 'Pande P Yukarin Audrey Elvina', 'id': '21796568'},
        {'name': 'Ayrelyn Vaustine Jhonatan', 'id': '21329676'},
        {'name': 'Clarissa Betaubun', 'id': '21851140'},
        {'name': 'David Raymond Tjhie', 'id': '22743002'},
        {'name': 'Samuel Susanto', 'id': '22808862'},
        {'name': 'Vincent Wijaya', 'id': '21089145'},
        {'name': 'Emir Ihsan Firas', 'id': '21796571'},
        {'name': 'Angelisa Sugianto', 'id': '22005841'},
        {'name': 'Abelle Milagro', 'id': '21892987'},
        {'name': 'Michael Chandra', 'id': '22295833'},
        {'name': 'Hanifa Wardhany Setiawan', 'id': '21660883'},
        {'name': 'Darryl Sutradjaja', 'id': '21688623'},
        {'name': 'Samuel Ritchie', 'id': '21500167'},
        {'name': 'Nadja Anjani', 'id': '20516244'},
        {'name': 'Marella Renata Jayani', 'id': '22845296'},
        {'name': 'Sanggar Saktivel', 'id': '23237111'},
        {'name': 'Kenneth Ashton Budiono', 'id': '21023321'},
        {'name': 'Maria Jessica Felicia Adimulyo', 'id': '21024117'},
        {'name': 'Stefanus Wicaksono', 'id': '22855350'},
        {'name': 'Bryan Kennet Jalesvira Sondakh', 'id': '21538032'},
        {'name': 'Desak Made Kirana Krishna', 'id': '21464933'},
        {'name': 'Landrieta Aisya Zhara', 'id': '21442052'},
        {'name': 'Jovan Santoso', 'id': '20709303'},
        {'name': 'Stephanie Valerie', 'id': '21856491'},
        # Business Club
        {'name': 'Jaipal Singh Grewal', 'id': '22438968'},
        {'name': 'Isabella Karunia Djuhadi', 'id': '22041586'},
        {'name': 'Jessyca Jue Ying Tan', 'id': '22570077'},
        {'name': 'Gwen Alicia', 'id': '21663206'},
        {'name': 'Hek Kit Yeo', 'id': '20525444'},
        {'name': 'Xinyu An', 'id': '22172703'},
        {'name': 'Candice Natalie', 'id': '21416578'},
        {'name': 'Vignesh Ilangovan', 'id': '21636583'},
        {'name': 'Bairui Feng', 'id': '21795536'},
        {'name': 'Karen Ang', 'id': '21368190'},
        # Chinese Community Club
        {'name': 'Xia Lu', 'id': '22811941'},
        {'name': 'Lang Yixiao', 'id': '23162734'},
        {'name': 'Yang Mengyu', 'id': '23081321'},
        {'name': 'Shixuan Jiang', 'id': '21998856'},
        {'name': 'Boxu Liu', 'id': '21728930'},
        {'name': 'Tianyi Luo', 'id': '21921865'},
        {'name': 'Hongyi An', 'id': '21240780'},
        {'name': 'Junshen Xiong', 'id': '21429136'},
        {'name': 'Kai Yang', 'id': '21615854'},
        {'name': 'Xiaofeng Wu', 'id': '21577378'},
        # Dance Club
        {'name': 'Ilya Yasmin Binte Nor Izham', 'id': '20654827'},
        {'name': 'Nurcahaya Dzakkiyah Salwa', 'id': '21774085'},
        {'name': 'Andre Lim', 'id': '21356412'},
        {'name': 'Man Tik Tse', 'id': '21672723'},
        {'name': 'Kevin Johan', 'id': '21622582'},
        {'name': 'Myo Set Paing', 'id': '21856705'},
        {'name': 'Nathan Sebastian Wiguno', 'id': '21590919'},
        {'name': 'Daniella Tidy', 'id': '22417970'},
        {'name': 'Jason Sutandar', 'id': '21462209'},
        {'name': 'Eda Ebru Ermis', 'id': '22910411'},
        # Music Club
        {'name': 'Kaylene Lim', 'id': '22662482'},
        {'name': 'Kazya Callista Fang', 'id': '21660935'},
        {'name': 'Evelyn Tamod-Oc Pasing', 'id': '22284899'},
        {'name': 'Clarryta Gunawan', 'id': '21645178'},
        {'name': 'Marwah Al-Rashid', 'id': '22704284'},
        {'name': 'Steven Malone', 'id': '22080835'},
        {'name': 'Teck Yao Ting', 'id': '22273402'},
        {'name': 'Teck Rong Ting', 'id': '21391536'},
        {'name': 'Mukesh Muthuraman', 'id': '23016006'},
        {'name': 'Binh Gia Minh To', 'id': '22034175'},

        # Dummy data for creating clubs
        {'name': 'Alexander Clara', 'id': '21100001'},
        {'name': 'Phoelo Hudson', 'id': '21100002'},
        {'name': 'Steven DeMayo Universe', 'id': '21100003'},
        {'name': 'Jenny Tran', 'id': '21100004'},
        {'name': 'Hershel Layton', 'id': '21100005'},
        {'name': 'Barbaros Gluteous Maximum', 'id': '21100006'},
        {'name': 'Sora Braviado Heart', 'id': '21100007'},
        {'name': 'Maya Fey', 'id': '21100008'},
        {'name': 'Steve Pham', 'id': '21100009'},
        {'name': 'Murphy Choy', 'id': '21100010'},




    ]

    # Create students
    created_students = create_students(students)
    print(f"Successfully created {len(created_students)} student profiles")