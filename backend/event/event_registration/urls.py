from django.urls import path
from .views import EventRegistrationCreateView, EventRegistrationDestroyView, EventParticipantsListView

urlpatterns = [
    path('register/', EventRegistrationCreateView.as_view(), name='event-registration'),
    path('<int:event_id>/participants/', EventParticipantsListView.as_view(), name='event-participants'),
    path('delete/<int:pk>/', EventRegistrationDestroyView.as_view(), name='delete-registration'),

]
