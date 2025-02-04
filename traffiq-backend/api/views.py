from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import UserPreference, SavedRoute
from .serializers import UserPreferenceSerializer, SavedRouteSerializer

class UserPreferenceViewSet(viewsets.ModelViewSet):
    queryset = UserPreference.objects.all()
    serializer_class = UserPreferenceSerializer

class SavedRouteViewSet(viewsets.ModelViewSet):
    queryset = SavedRoute.objects.all()
    serializer_class = SavedRouteSerializer
