from rest_framework import serializers
from .models import ClubEventPage
import os
from colorthief import ColorThief  
from django.core.cache import cache
import colorsys 


class ClubEventPageSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='event.name')
    description = serializers.CharField(source='event.description')
    banner_image = serializers.ImageField(source='event.banner')
    club_logo = serializers.ImageField(source='event.club.logo')  # assuming this is directly on ClubEventPage

    class Meta:
        model = ClubEventPage
        fields = ['id', 'title', 'description', 'banner_image', 'club_logo'] #, 'club_logo' <-- add this to add logo


        def get_dominant_color(self, obj):
            cache_key = f"event_{obj.id}_dominant_color"
            dominant_color = cache.get(cache_key)
            if not dominant_color and obj.banner and os.path.exists(obj.banner.path):
                try:
                    color_thief = ColorThief(obj.banner.path)
                    dominant_color = color_thief.get_color(quality=1)
                    cache.set(cache_key, dominant_color, timeout=3600)
                except Exception as e:
                    print(f"Error calculating dominant color: {e}")
            return dominant_color

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
            return shadow_color

    #def get_club_logo(self, obj):
    #   return '/media/club_logos/dlogo.png'

