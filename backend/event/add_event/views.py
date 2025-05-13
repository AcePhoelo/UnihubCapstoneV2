from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter
from .models import Event
from .serializers import EventSerializer
from clubs.models import Club
from user_profile.models import Student
from api.utils import clean_input

class EventPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class EventCreateView(generics.CreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        club_id = self.request.data.get('club')
        if not club_id:
            raise PermissionDenied("Club ID is required.")
        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            raise PermissionDenied("Club does not exist.")

        # Ensure the user is the president of the club
        if club.president.user != self.request.user:
            raise PermissionDenied("You are not authorized to create events for this club.")

        serializer.save(created_by=self.request.user, club=club)

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        obj = super().get_object()
        # Always ensure we have fresh club data
        if obj.club:
            obj.club_details = {
                'name': obj.club.name,
                'logo': obj.club.logo.url if obj.club.logo else None,
                'president': {
                    'id': obj.club.president.id,
                    'studentid': obj.club.president.studentid,
                    'full_name': obj.club.president.full_name,
                    'profile_picture': obj.club.president.profile_picture.url if obj.club.president.profile_picture else None
                } if obj.club.president else None
            }
        return obj

    def get_queryset(self):
        # Return all events instead of filtering by user
        return self.queryset.all()

    def perform_update(self, serializer):
        user_student = Student.objects.get(user=self.request.user)
        event_creator = Student.objects.get(user=self.get_object().created_by)
        
        # Compare student IDs instead of Django User objects
        if user_student.studentid != event_creator.studentid:
            raise PermissionDenied("You do not have permission to edit this event.")
        serializer.save()

class EventListView(generics.ListAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = self.queryset
        club_id = self.request.query_params.get('club_id')
        if club_id:
            club_id = clean_input(club_id)
            queryset = queryset.filter(club_id=club_id)
        return queryset.order_by('date')