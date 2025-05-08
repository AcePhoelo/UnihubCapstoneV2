from rest_framework import serializers
from .models import Event
from clubs.models import Club  # Assuming the Club model is in the clubs app
from user_profile.serializers import StudentSerializer
from user_profile.models import Student
from colorthief import ColorThief
from django.core.cache import cache
import os
import colorsys

class ClubSerializer(serializers.ModelSerializer):
    president = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ['name', 'logo', 'president']

    def get_president(self, obj):
        """
        Returns the club president using the StudentSerializer.
        """
        if hasattr(obj, 'president') and obj.president:
            return StudentSerializer(obj.president).data
        return None

class EventSerializer(serializers.ModelSerializer):
    club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all(), write_only=True)
    club_details = ClubSerializer(source='club', read_only=True)
    created_by_details = serializers.SerializerMethodField()  # Add this line
    dominant_color = serializers.SerializerMethodField()
    secondary_color = serializers.SerializerMethodField()
    tertiary_color = serializers.SerializerMethodField()
    shadow_color = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_by']
        
    def get_created_by_details(self, obj):
        """Return details about the creator of the event"""
        if hasattr(obj, 'created_by') and obj.created_by:
            try:
                student = Student.objects.get(user=obj.created_by)
                return {
                    'studentid': student.studentid,
                    'full_name': student.full_name if hasattr(student, 'full_name') else obj.created_by.get_full_name(),
                    'email': obj.created_by.email
                }
            except:
                return None
        return None
    
        
    def get_dominant_color(self, obj):
        cache_key = f"event_{obj.id}_dominant_color"
        dominant_color = cache.get(cache_key)
        if not dominant_color:
            if obj.banner and os.path.exists(obj.banner.path):
                try:
                    color_thief = ColorThief(obj.banner.path)
                    palette = color_thief.get_palette(color_count=3, quality=1)
                    dominant_color = palette[0]
                    cache.set(cache_key, dominant_color, timeout=3600)
                except Exception as e:
                    print(f"Error calculating dominant color: {e}")
                    return None
        return dominant_color

    def get_secondary_color(self, obj):
        cache_key = f"event_{obj.id}_secondary_color"
        secondary = cache.get(cache_key)
        if not secondary:
            if obj.banner and os.path.exists(obj.banner.path):
                try:
                    palette = ColorThief(obj.banner.path).get_palette(color_count=3, quality=1)
                    if len(palette) > 1:
                        secondary = palette[1]
                        cache.set(cache_key, secondary, timeout=3600)
                except Exception as e:
                    print(f"Error calculating secondary color: {e}")
                    return None
        return secondary

    def get_tertiary_color(self, obj):
        cache_key = f"club_{obj.id}_tertiary_color"
        tertiary = cache.get(cache_key)
        if not tertiary:
            if obj.banner and os.path.exists(obj.banner.path):
                try:
                    palette = ColorThief(obj.banner.path).get_palette(color_count=3, quality=1)
                    if len(palette) > 2:
                        tertiary = palette[2]
                        cache.set(cache_key, tertiary, timeout=3600)
                except Exception as e:
                    print(f"Error calculating tertiary color: {e}")
                    return None
        return tertiary

    def get_shadow_color(self, obj):
        cache_key = f"event_{obj.id}_shadow_color"
        shadow_color = cache.get(cache_key)
        if not shadow_color:
            dominant_color = self.get_dominant_color(obj)
            if dominant_color:
                try:
                    r, g, b = [x / 255.0 for x in dominant_color]
                    h, l, s = colorsys.rgb_to_hls(r, g, b)
                    l = max(0, l * 0.3)
                    s = max(0, s * 0.5)
                    r, g, b = colorsys.hls_to_rgb(h, l, s)
                    shadow_color = [int(r * 255), int(g * 255), int(b * 255)]
                    cache.set(cache_key, shadow_color, timeout=2592000)
                except Exception as e:
                    print(f"Error calculating shadow color: {e}")
                    return None
        return shadow_color

    
