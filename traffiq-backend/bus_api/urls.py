# bus_api/urls.py
from django.urls import path
from .views import routes_view, stops_view, live_buses_view, alerts_view

urlpatterns = [
    path('routes/', routes_view, name='bus_routes'),
    path('stops/', stops_view, name='bus_stops'),
    path('live/', live_buses_view, name='live_buses'),
    path('alerts/', alerts_view, name='system_alerts'),
]
