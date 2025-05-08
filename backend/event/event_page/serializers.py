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
        fields = ['id', 'title', 'description', 'banner_image', 'club_logo', 'dominant_color', 'secondary_color', 'tertiary_color', 'shadow_color'] #, 'club_logo' <-- add this to add logo


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

