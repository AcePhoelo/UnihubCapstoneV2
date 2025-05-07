from rest_framework import serializers
from .models import EventRegistration
from user_profile.serializers import StudentSerializer
from event.add_event.serializers import EventSerializer  # Import the event serializer


class EventRegistrationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)  # Add this line to include nested student data
    event = EventSerializer(read_only=True)  # Add this line to expand event details

    class Meta:
        model = EventRegistration
        fields = '__all__'