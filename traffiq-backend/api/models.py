from django.db import models

class UserPreference(models.Model):
    user_id = models.CharField(max_length=255, unique=True)
    preferred_transport = models.CharField(max_length=50, choices=[("bus", "Bus"), ("train", "Train"), ("bike", "Bike"), ("car", "Car")])

class SavedRoute(models.Model):
    user = models.ForeignKey(UserPreference, on_delete=models.CASCADE)
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    departure_time = models.DateTimeField()
    preferred_mode = models.CharField(max_length=50)
