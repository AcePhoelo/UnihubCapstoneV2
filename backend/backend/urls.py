from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api.views import login_view, set_csrf_cookie
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from feedback.views import FeedbackListCreateView
from .views import frontend
from api.throttling import AuthRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Create a custom token view that includes throttling
class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [AuthRateThrottle]

class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [AuthRateThrottle]


urlpatterns = [
    # Frontend
    path("", frontend, name="frontend"),

    # Admin panel
    path("admin/", admin.site.urls),

    # API endpoints
    path("api/token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", ThrottledTokenRefreshView.as_view(), name="token_refresh"),
    path("api/login/", login_view, name="login"),
    path("api/csrf/", set_csrf_cookie, name="set_csrf_cookie"),
    path("api/", include("api.urls")),

    # Feedback and collaboration apps
    path("api/feedback/", include("feedback.urls")),
    path("collaboration/", include("collaboration.urls")),

    # Profile and clubs apps
    path('profile/', include('user_profile.urls')),  # Include profile app URLs
    path('clubs/', include('clubs.urls')),  # Include clubs app URLs

        # Event apps
    path("api/event/add_event/", include("event.add_event.urls")),  # Add event app
    path("api/event/event_page/", include("event.event_page.urls")),  # Event page app
    path("api/event/event_registration/", include("event.event_registration.urls")),  # Event registration app
    path("api/event/", include("event.event_list.urls")),
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)