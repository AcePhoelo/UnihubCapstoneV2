from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Club, ColorPalette
from event.add_event.models import Event
from colorthief import ColorThief
import colorsys
import os
import json

def calculate_colors(image_path):
    """Calculate and save colors for an image path"""
    if not os.path.exists(image_path):
        return None
        
    try:
        # Create or get color palette record
        color_palette, created = ColorPalette.objects.get_or_create(image_path=image_path)
        
        # If we already have all colors, no need to recalculate
        if all([
            color_palette.dominant_color,
            color_palette.secondary_color, 
            color_palette.tertiary_color,
            color_palette.shadow_color
        ]):
            return color_palette
            
        # Calculate colors
        color_thief = ColorThief(image_path)
        palette = color_thief.get_palette(color_count=3, quality=1)
        
        # Store dominant color
        if len(palette) > 0:
            color_palette.dominant_color = json.dumps(palette[0])
        
        # Store secondary color
        if len(palette) > 1:
            color_palette.secondary_color = json.dumps(palette[1])
        
        # Store tertiary color
        if len(palette) > 2:
            color_palette.tertiary_color = json.dumps(palette[2])
        
        # Calculate shadow color
        if len(palette) > 0:
            dominant = palette[0]
            r, g, b = [x / 255.0 for x in dominant]
            h, l, s = colorsys.rgb_to_hls(r, g, b)
            l = max(0, l * 0.3)
            s = max(0, s * 0.5)
            r, g, b = colorsys.hls_to_rgb(h, l, s)
            shadow_color = [int(r * 255), int(g * 255), int(b * 255)]
            color_palette.shadow_color = json.dumps(shadow_color)
        
        # Save the palette
        color_palette.save()
        return color_palette
        
    except Exception as e:
        print(f"Error calculating colors: {e}")
        return None

@receiver(post_save, sender=Club)
def calculate_club_colors(sender, instance, created=False, **kwargs):
    """Calculate colors when a club is created or updated"""
    if instance.banner and hasattr(instance.banner, 'path'):
        calculate_colors(instance.banner.path)
        
@receiver(post_save, sender=Event)
def calculate_event_colors(sender, instance, created=False, **kwargs):
    """Calculate colors when an event is created or updated"""
    if instance.banner and hasattr(instance.banner, 'path'):
        calculate_colors(instance.banner.path)