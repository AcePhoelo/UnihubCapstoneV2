from django.urls import path
from .views import student_list, student_detail, get_user_profile, update_profile_picture
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('students/', student_list, name='student-list'),
    path('students/<str:studentid>/', student_detail, name='student-detail'),
    path('profile/', get_user_profile, name='get_user_profile'),
    path('profile/<str:student_id>/', get_user_profile, name='get_user_profile_by_id'),  # New route
    path('update-picture/', update_profile_picture, name='update_profile_picture'),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)