from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    clubsjoined = serializers.SerializerMethodField()  # Use SerializerMethodField to avoid recursion
    leadership_clubs = serializers.SerializerMethodField()  # Use SerializerMethodField to avoid recursion

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return None

    def get_clubsjoined(self, obj):
        from clubs.serializers import ClubListSerializer  # Lazy import
        return ClubListSerializer(obj.clubsjoined.all(), many=True, context=self.context).data

    def get_leadership_clubs(self, obj):
        from clubs.serializers import ClubListSerializer  # Lazy import
        return ClubListSerializer(obj.leadership_clubs.all(), many=True, context=self.context).data

    class Meta:
        model = Student
        fields = [
            'id',
            'full_name',
            'email',
            'studentid',
            'profile_picture',
            'badges',
            'clubsjoined',
            'leadership_clubs',
        ]