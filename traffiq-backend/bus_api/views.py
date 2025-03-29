# bus_api/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import passiogo
from passiogo import getSystemFromID

# Set the GSU system ID (adjust if necessary)
GSU_SYSTEM_ID = 480

@csrf_exempt
def routes_view(request):
    """
    Returns all routes for the GSU bus system.
    Prints all route details for debugging.
    """
    print("[routes_view] Request received at /api/bus/routes/") # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[routes_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        routes = system.getRoutes()
        print("[routes_view] Fetched Routes (passiogo objects):") # DEBUG
        for route in routes:
            print(f"  Route ID: {route.id}, Name: {route.name}, ShortName: {route.shortName}") # DEBUG
            print(f"  Route object __dict__: {route.__dict__}") # DEBUG - Full route object

        routes_serializable = []
        for route in routes:
            # Try to compute a polyline using the stops for the route.
            polyline = []
            try:
                route_stops = route.getStops()
                if route_stops:
                    polyline = [
                        {"latitude": stop.latitude, "longitude": stop.longitude}
                        for stop in route_stops
                    ]
            except Exception as e:
                print(f"[routes_view] Error computing polyline for route {route.id}: {e}")
            routes_serializable.append({
                "id": str(route.id),
                "name": route.name,
                "shortName": route.shortName,
                "polyline": polyline,
            })
        print("[routes_view] Returning routes_serializable:", routes_serializable) # DEBUG
        return JsonResponse({"routes": routes_serializable})
    except Exception as e:
        print(f"[routes_view] Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def stops_view(request):
    """
    Returns all stops for the GSU bus system.
    If a query parameter 'routeIds' is provided, filters stops by those routes.
    Prints stop details for debugging.
    """
    print("[stops_view] Request received at /api/bus/stops/") # DEBUG
    print("[stops_view] GSU_SYSTEM_ID:", GSU_SYSTEM_ID) # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[stops_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        print("[stops_view] System found:", system) # DEBUG
        stops = system.getStops()
        print("[stops_view] Fetched Stops (passiogo objects):") # DEBUG
        for stop in stops:
            print(f"  Stop ID: {stop.id}, Name: {stop.name}") # DEBUG
            print(f"  Stop routesAndPositions (raw): {stop.routesAndPositions}") # DEBUG - Raw routesAndPositions
            print(f"  Stop object __dict__: {stop.__dict__}") # DEBUG - Full stop object

        stops_serializable = []
        route_ids_param = request.GET.get('routeIds')
        filter_ids = None
        if route_ids_param:
            filter_ids = set(route_ids_param.split(','))
        for stop in stops:
            # Assume stop.routesAndPositions is a dict with route IDs as keys.
            if filter_ids:
                if not any(route_id in filter_ids for route_id in stop.routesAndPositions.keys()):
                    continue
            stops_serializable.append({
                "id": stop.id,
                "name": stop.name,
                "latitude": stop.latitude,
                "longitude": stop.longitude,
                "routesAndPositions": stop.routesAndPositions,
            })
        print("[stops_view] Returning stops_serializable:", stops_serializable) # DEBUG
        return JsonResponse({"stops": stops_serializable})
    except Exception as e:
        print(f"[stops_view] Error in stops_view: {e}") # More specific error log
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def live_buses_view(request):
    """
    Returns live bus data for the GSU bus system.
    Prints vehicle details for debugging.
    Optionally filters by routeIds (comma-separated).
    """
    print("[live_buses_view] Request received at /api/bus/live/") # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[live_buses_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        vehicles = system.getVehicles(appVersion=2)
        print("[live_buses_view] Fetched Vehicles:")
        for vehicle in vehicles:
            print(vehicle.__dict__)
        buses_serializable = []
        route_ids_param = request.GET.get('routeIds')
        filter_ids = None
        if route_ids_param:
            filter_ids = set(route_ids_param.split(','))
        for vehicle in vehicles:
            if filter_ids and str(vehicle.routeId) not in filter_ids:
                continue
            buses_serializable.append({
                "id": str(vehicle.id),
                "name": vehicle.name,
                "latitude": float(vehicle.latitude),
                "longitude": float(vehicle.longitude),
                "speed": vehicle.speed,
                "routeId": str(vehicle.routeId),
                "routeName": vehicle.routeName,
                "color": vehicle.color,  # color provided by the API, e.g. '#d62728'
            })
        print("[live_buses_view] Returning buses_serializable:", buses_serializable) # DEBUG
        return JsonResponse({"buses": buses_serializable})
    except Exception as e:
        print(f"[live_buses_view] Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def alerts_view(request):
    """
    Returns system alerts for the GSU bus system.
    Prints alert details for debugging.
    """
    print("[alerts_view] Request received at /api/bus/alerts/") # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[alerts_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        alerts = system.getSystemAlerts()
        print("[alerts_view] Fetched Alerts:")
        for alert in alerts:
            print(alert.__dict__)
        alerts_serializable = []
        for alert in alerts:
            alerts_serializable.append({
                "id": alert.id,
                "name": alert.name,
                "html": alert.html,
                "dateTimeCreated": alert.dateTimeCreated,
            })
        print("[alerts_view] Returning alerts_serializable:", alerts_serializable) # DEBUG
        return JsonResponse({"alerts": alerts_serializable})
    except Exception as e:
        print(f"[alerts_view] Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)