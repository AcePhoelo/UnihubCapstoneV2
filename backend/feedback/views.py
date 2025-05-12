from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import OrderingFilter
from .models import Feedback
from .serializers import FeedbackSerializer
from user_profile.models import Student
from api.utils import clean_input

# feedback/views.py
from django.core.validators import MinLengthValidator, MaxLengthValidator
from rest_framework import serializers

class FeedbackSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(100)]
    )
    role = serializers.CharField(
        validators=[MinLengthValidator(2), MaxLengthValidator(50)]
    )
    experience = serializers.CharField(
        validators=[MinLengthValidator(5), MaxLengthValidator(1000)]
    )
    
    class Meta:
        model = Feedback
        fields = ['name', 'role', 'like', 'dislike', 'satisfaction', 'experience']
    
    def validate(self, data):
        for field in ['name', 'role', 'like', 'dislike', 'experience']:
            if field in data and isinstance(data[field], str):
                data[field] = clean_input(data[field])
        
        # Add custom validation rules
        if data.get('satisfaction') not in ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very Unsatisfied']:
            raise serializers.ValidationError({"satisfaction": "Invalid satisfaction level"})
        return data
    
class FeedbackPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class FeedbackListCreateView(ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = FeedbackPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ['satisfaction', 'id'] 
    ordering = ['-id']

    def get_queryset(self):
        queryset = Feedback.objects.all()
        
        # Get and sanitize query parameters
        event_id = self.request.query_params.get('event_id')
        event_name = self.request.query_params.get('event_name')
        user_id = self.request.query_params.get('user_id')
        
        if event_id:
            event_id = clean_input(event_id)
        if event_name:
            event_name = clean_input(event_name)
        if user_id:
            user_id = clean_input(user_id)
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        if event_name:
            queryset = queryset.filter(event__name=event_name)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Get the student associated with the current user
        try:
            student = Student.objects.get(user=self.request.user)
            serializer.save(student=student)
        except Student.DoesNotExist:
            serializer.save()