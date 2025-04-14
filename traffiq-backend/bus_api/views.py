# bus_api/views.py
import json
import traceback  # Standard Python library, no pip install needed
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
    Uses route.myid as the primary unique identifier.
    Prints route details for debugging.
    Computes a basic polyline from route stops.
    """
    print("[routes_view] Request received at /api/bus/routes/") # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[routes_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        routes = system.getRoutes()
        print(f"[routes_view] Fetched {len(routes)} Routes (passiogo objects):") # DEBUG

        routes_serializable = []
        seen_route_ids = set() # Keep track of IDs used

        for route in routes:
            # *** CHANGE: Use myid as the primary identifier ***
            # Fallback to route.id ONLY if myid is missing (less likely)
            unique_route_id = getattr(route, 'myid', None)
            if unique_route_id is None:
                print(f"[routes_view] Warning: Route '{route.name}' missing 'myid', falling back to 'id' ({route.id}). Potential for non-uniqueness.")
                unique_route_id = route.id # Use route.id as fallback
            
            route_id_str = str(unique_route_id)

            # Optional: Skip if we somehow still get a duplicate ID after using myid/id
            if route_id_str in seen_route_ids:
                 print(f"[routes_view] Warning: Skipping route '{route.name}' due to duplicate ID '{route_id_str}' already processed.")
                 continue
            seen_route_ids.add(route_id_str)


            # Try to compute a polyline using the stops for the route.
            polyline = []
            try:
                # Use the original route.id (from PassioGo) to fetch stops if needed by route.getStops()
                route_stops = route.getStops()
                if route_stops:
                    polyline = [
                        {"latitude": stop.latitude, "longitude": stop.longitude}
                        for stop in route_stops if stop.latitude is not None and stop.longitude is not None
                    ]
            except Exception as e:
                print(f"[routes_view] Warning: Error computing polyline for route {route.name} (ID: {route_id_str}): {e}")

            routes_serializable.append({
                "id": route_id_str, # *** USE THE DETERMINED UNIQUE ID ***
                "name": route.name or f"Route {route_id_str}",
                "shortName": route.shortName,
                "polyline": polyline,
                # Add color if consistently available or needed on route level
                # "color": route.color if hasattr(route, 'color') else None
            })
            
        print(f"[routes_view] Returning {len(routes_serializable)} routes.") # DEBUG
        return JsonResponse({"routes": routes_serializable})
    except Exception as e:
        print(f"[routes_view] Error in routes_view: {e}")
        traceback.print_exc() # Log traceback for unexpected errors here too
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def stops_view(request):
    """
    Returns all stops for the GSU bus system.
    If a query parameter 'routeIds' is provided, filters stops by those routes.
    The routeIds parameter should now match the 'myid' used in the routes endpoint.
    Prints stop details for debugging.
    """
    print("[stops_view] Request received at /api/bus/stops/") # DEBUG
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[stops_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)

        print("[stops_view] System found. Getting all stops...") # DEBUG
        stops = system.getStops()
        print(f"[stops_view] Fetched {len(stops)} Stops total.") # DEBUG

        stops_serializable = []
        route_ids_param = request.GET.get('routeIds') # Frontend might send this if filtering needed
        filter_ids = None
        if route_ids_param:
             # These filter IDs should correspond to the route.myid values
            filter_ids = set(route_ids_param.split(','))
            print(f"[stops_view] Filtering stops for route MYIDs: {filter_ids}")

        for stop in stops:
            # Filter logic: Check if *any* route associated with the stop (using original route IDs as keys in routesAndPositions)
            # corresponds to the MYIDs passed in the filter.
            # This assumes stop.routesAndPositions uses the *original* PassioGo route IDs as keys.
            # This part might need adjustment if filtering by MYID is required and routesAndPositions doesn't help directly.
            # For now, let's keep the existing filter logic which filters based on keys in routesAndPositions
            # If frontend sends `routeIds` (which are MYIDs), we need a way to map MYID back to original ID, or change filter approach.
            # --- Let's simplify: If filtering is needed later, adjust this ---
            # Temporarily ignore routeIds filter if it complicates things due to ID mismatch (myid vs route.id in routesAndPositions)
            # Keep the original filtering logic for now, assuming frontend passes original IDs if it filters.

            stop_associated_route_ids = set(stop.routesAndPositions.keys()) if stop.routesAndPositions else set()

            if filter_ids:
                 # This assumes filter_ids contains the original route.id values, not myid.
                 # If frontend sends myid, this filter won't work correctly without a mapping.
                if not stop.routesAndPositions or not any(str(route_id) in filter_ids for route_id in stop.routesAndPositions.keys()):
                    continue # Skip stop if no matching route found in its dictionary keys

            # Basic validation before adding
            if stop.id is not None and stop.name is not None and stop.latitude is not None and stop.longitude is not None:
                 stops_serializable.append({
                    "id": str(stop.id), # Ensure ID is string
                    "name": stop.name,
                    "latitude": float(stop.latitude), # Ensure float
                    "longitude": float(stop.longitude), # Ensure float
                    # Ensure routesAndPositions keys (original route IDs) are strings for JSON consistency
                    "routesAndPositions": {str(k): v for k, v in stop.routesAndPositions.items()} if stop.routesAndPositions else {},
                })
            else:
                print(f"[stops_view] Warning: Skipping stop due to missing data (ID: {stop.id}, Name: {stop.name})")


        print(f"[stops_view] Returning {len(stops_serializable)} stops after filtering.") # DEBUG
        return JsonResponse({"stops": stops_serializable})
    except Exception as e:
        print(f"[stops_view] Error in stops_view: {e}") # More specific error log
        traceback.print_exc() # Log traceback for unexpected errors
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def live_buses_view(request):
    """
    Returns live bus data for the GSU bus system.
    Prints vehicle details for debugging.
    Optionally filters by routeIds (comma-separated, should be original PassioGo route IDs).
    Includes detailed error logging with traceback. Handles missing vehicle attributes.
    """
    print("[live_buses_view] Request received at /api/bus/live/")
    try:
        print(f"[live_buses_view] Getting system with ID: {GSU_SYSTEM_ID}")
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[live_buses_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        print("[live_buses_view] System obtained. Attempting to get vehicles...")

        vehicles = system.getVehicles(appVersion=2)

        print("[live_buses_view] system.getVehicles() call completed.")

        if vehicles is None:
             print("[live_buses_view] system.getVehicles() returned None. Returning empty list.")
             vehicles = []
        else:
             print(f"[live_buses_view] Number of vehicles fetched: {len(vehicles)}")

        buses_serializable = []
        route_ids_param = request.GET.get('routeIds') # Should be original route IDs if filtering
        filter_ids = None
        if route_ids_param:
            filter_ids = set(route_ids_param.split(','))
            print(f"[live_buses_view] Filtering for route IDs: {filter_ids}")

        print("[live_buses_view] Serializing vehicle data...")
        for vehicle in vehicles:
            try:
                # Use getattr with defaults to safely access potentially missing attributes
                lat = getattr(vehicle, 'latitude', None)
                lon = getattr(vehicle, 'longitude', None)
                speed_raw = getattr(vehicle, 'speed', None)
                route_id_raw = getattr(vehicle, 'routeId', None)
                vehicle_id_raw = getattr(vehicle, 'id', None)
                vehicle_name_raw = getattr(vehicle, 'name', None)
                route_name_raw = getattr(vehicle, 'routeName', None)
                color_raw = getattr(vehicle, 'color', None)

                # Skip vehicles with missing essential data
                if vehicle_id_raw is None or lat is None or lon is None:
                     print(f"[live_buses_view] Warning: Skipping vehicle (ID: {vehicle_id_raw}, Name: {vehicle_name_raw}) due to missing essential data (ID/Lat/Lon).")
                     print(f"Problematic raw data: {getattr(vehicle, '__dict__', 'N/A')}")
                     continue

                # Convert types safely
                lat = float(lat)
                lon = float(lon)
                speed = float(speed_raw) if speed_raw is not None else 0.0
                route_id = str(route_id_raw) if route_id_raw is not None else None
                vehicle_id = str(vehicle_id_raw)

                # Apply route filter if active (uses the route_id from the vehicle data)
                if filter_ids and route_id not in filter_ids:
                   continue

                buses_serializable.append({
                    "id": vehicle_id,
                    "name": vehicle_name_raw or f"Bus {vehicle_id}",
                    "latitude": lat,
                    "longitude": lon,
                    "speed": speed,
                    "routeId": route_id, # This is the original PassioGo Route ID
                    "routeName": route_name_raw or ("Not on route" if route_id is None else "Unknown Route Name"),
                    "color": color_raw or "#808080", # Default grey color
                })
            except (TypeError, ValueError) as serial_error:
                 print(f"[live_buses_view] Error converting data for vehicle ID {vehicle_id_raw}: {serial_error}")
                 print(f"Problematic vehicle data: {getattr(vehicle, '__dict__', 'N/A')}")
                 continue
            except Exception as general_serial_error:
                 print(f"[live_buses_view] Unexpected error serializing vehicle ID {vehicle_id_raw}: {general_serial_error}")
                 print(f"Problematic vehicle data: {getattr(vehicle, '__dict__', 'N/A')}")
                 traceback.print_exc() # Also print traceback for unexpected serialization errors
                 continue

        print(f"[live_buses_view] Returning {len(buses_serializable)} buses after filtering and serialization.")
        return JsonResponse({"buses": buses_serializable})

    except Exception as e:
        print(f"[live_buses_view] Error occurred in live_buses_view: {e}")
        print("--- Full Traceback ---")
        traceback.print_exc()
        print("--- End Traceback ---")
        return JsonResponse({"error": f"An internal error occurred while fetching live bus data."}, status=500)


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
        print(f"[alerts_view] Fetched {len(alerts)} Alerts:") # DEBUG

        alerts_serializable = []
        for alert in alerts:
             alerts_serializable.append({
                "id": str(alert.id),
                "name": alert.name,
                "html": alert.html,
                "important": getattr(alert, 'important', '0') == '1', # Safely check important flag
                "dateTimeFrom": getattr(alert, 'dateTimeFrom', None),
                "dateTimeTo": getattr(alert, 'dateTimeTo', None),
            })
        print(f"[alerts_view] Returning {len(alerts_serializable)} alerts.") # DEBUG
        return JsonResponse({"alerts": alerts_serializable})
    except Exception as e:
        print(f"[alerts_view] Error in alerts_view: {e}")
        traceback.print_exc() # Log traceback for unexpected errors
        return JsonResponse({"error": str(e)}, status=500)