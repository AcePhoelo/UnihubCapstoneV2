from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Student
from rest_framework.response import Response
from .serializers import StudentSerializer
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
@login_required
def student_list(request):
    students = Student.objects.all()
    student_data = []
    for student in students:
        student_data.append({
            "name": student.full_name,
            "email": student.email,
            "studentid": student.studentid,
            "badges": student.badges,
            "clubsjoined": list(student.clubsjoined.values_list('name', flat=True)),  
            "leadership_clubs": list(student.leadership_clubs.values_list('name', flat=True)),  
        })
    return JsonResponse(student_data, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_detail(request, studentid):
    try:
        student = Student.objects.get(studentid=studentid)
        return Response({
            "name": student.full_name,
            "email": student.email,
            "studentid": student.studentid,
            "badges": student.badges,
            "clubsjoined": [
                {
                    "id": club.id,
                    "name": club.name,
                    "description": club.description,
                    "banner": club.banner.url if club.banner else None,
                    "logo": club.logo.url if club.logo else None
                }
                for club in student.clubsjoined.all()
            ],
            "leadership_clubs": [
                {
                    "id": club.id,
                    "name": club.name,
                    "description": club.description,
                    "banner": club.banner.url if club.banner else None,
                    "logo": club.logo.url if club.logo else None
                }
                for club in student.leadership_clubs.all()
            ],
            "profile_picture": student.profile_picture.url if student.profile_picture else None,
        })
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    
@api_view(['GET'])
def get_user_profile(request):
    user = request.user
    if user.is_authenticated:
        try:
            student = Student.objects.get(user=user)
            serializer = StudentSerializer(student, context={'request': request})
            return Response(serializer.data, status=200)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)
    return Response({"error": "User not authenticated"}, status=401)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_picture(request):
    """Update the profile picture of the currently logged-in user."""
    try:
        student = Student.objects.get(user=request.user)
        
        if 'profile_picture' in request.FILES:
            # Delete old profile picture if exists to avoid storage issues
            if student.profile_picture:
                student.profile_picture.delete(save=False)
                
            student.profile_picture = request.FILES['profile_picture']
            student.save()
            
            # Build absolute URL for the profile picture
            profile_pic_url = request.build_absolute_uri(student.profile_picture.url) if student.profile_picture else None
            
            return Response({
                'success': True,
                'profile_picture': profile_pic_url
            }, status=200)
        
        return Response({'error': 'No profile picture provided'}, status=400)
    except Student.DoesNotExist:
        return Response({'error': 'Student profile not found'}, status=404)