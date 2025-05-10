from django.urls import path
from .views import EventListView, ClubEventsView

urlpatterns = [
    path('', EventListView.as_view(), name='event-list'),
    path('club_events/', ClubEventsView.as_view(), name='club-events'),
]