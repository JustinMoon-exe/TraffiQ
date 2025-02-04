from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserPreferenceViewSet, SavedRouteViewSet

router = DefaultRouter()
router.register(r'preferences', UserPreferenceViewSet)
router.register(r'routes', SavedRouteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
