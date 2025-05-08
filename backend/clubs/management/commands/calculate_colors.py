from django.core.management.base import BaseCommand
from clubs.models import Club
from event.add_event.models import Event
from clubs.signals import calculate_colors
import os
from tqdm import tqdm  # Optional for progress bar

class Command(BaseCommand):
    help = 'Pre-calculate and store colors for all existing club and event banners'

    def handle(self, *args, **options):
        self.stdout.write('Calculating colors for club banners...')
        clubs = Club.objects.all()
        
        # Process clubs with progress bar
        for club in tqdm(clubs, desc="Processing clubs"):
            if club.banner and hasattr(club.banner, 'path') and os.path.exists(club.banner.path):
                color_palette = calculate_colors(club.banner.path)
                if color_palette:
                    self.stdout.write(f'  ✓ Calculated colors for club: {club.name}')
                else:
                    self.stdout.write(f'  ✗ Failed to calculate colors for club: {club.name}')
        
        self.stdout.write('Calculating colors for event banners...')
        events = Event.objects.all()
        
        # Process events with progress bar
        for event in tqdm(events, desc="Processing events"):
            if event.banner and hasattr(event.banner, 'path') and os.path.exists(event.banner.path):
                color_palette = calculate_colors(event.banner.path)
                if color_palette:
                    self.stdout.write(f'  ✓ Calculated colors for event: {event.name}')
                else:
                    self.stdout.write(f'  ✗ Failed to calculate colors for event: {event.name}')
        
        self.stdout.write(self.style.SUCCESS('Successfully calculated all colors'))