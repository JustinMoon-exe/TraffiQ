# bus_api/views.py
import json
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import passiogo
from passiogo import getSystemFromID

GSU_SYSTEM_ID = 480

@csrf_exempt
def routes_view(request):
    """
    Returns all routes for the GSU bus system.
    Uses route.myid as the 'id' field.
    """
    print("[routes_view] Request received at /api/bus/routes/")
    try:
        system = getSystemFromID(GSU_SYSTEM_ID)
        if not system:
            print("[routes_view] System not found for ID:", GSU_SYSTEM_ID)
            return JsonResponse({"error": "System not found"}, status=404)
        routes = system.getRoutes()
        print(f"[routes_view] Fetched {len(routes)} Routes (passiogo objects):")

        routes_serializable = []
        seen_myids = set()

        for route in routes:
            myid = getattr(route, 'myid', None)
            if myid is None:
                 print(f"[routes_view] CRITICAL WARNING: Route '{route.name}' missing 'myid'. Skipping.")
                 continue

            myid_str = str(myid)

            if myid_str in seen_myids:
                 print(f"[routes_view] Warning: Skipping route '{route.name}' because its unique ID (myid) '{myid_str}' has already been processed.")
                 continue
            seen_myids.add(myid_str)

            polyline = []
            try:
                route_stops = route.getStops()
                if route_stops:
                    polyline = [
                        {"latitude": stop.latitude, "longitude": stop.longitude}
                        for stop in route_stops if stop.latitude is not None and stop.longitude is not None
                    ]
            except Exception as e:
                print(f"[routes_view] Warning: Error computing polyline for route {route.name} (myid: {myid_str}): {e}")

            routes_serializable.append({
                "id": myid_str,
                "name": route.name or f"Route {myid_str}",
                "shortName": route.shortName,
                "polyline": polyline,
            })

        print(f"[routes_view] Returning {len(routes_serializable)} routes.")
        return JsonResponse({"routes": routes_serializable})
    except Exception as e:
        print(f"[routes_view] Error in routes_view: {e}")
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def stops_view(request):
    """ Returns all stops. routesAndPositions keys ARE route.myid. """
    print("[stops_view] Request received at /api/bus/stops/")
    try:
        system = getSystemFromID(GSU_SYSTEM_ID);
        if not system: return JsonResponse({"error": "System not found"}, status=404)
        print("[stops_view] System found. Getting all stops...")
        stops = system.getStops(); print(f"[stops_view] Fetched {len(stops)} Stops total.")
        stops_serializable = []
        print(f"[stops_view] NOTE: Returning all stops.")
        for stop in stops:
            if stop.id is not None and stop.name is not None and stop.latitude is not None and stop.longitude is not None:
                 stops_serializable.append({
                    "id": str(stop.id), "name": stop.name, "latitude": float(stop.latitude), "longitude": float(stop.longitude),
                    "routesAndPositions": {str(k): v for k, v in stop.routesAndPositions.items()} if stop.routesAndPositions else {},
                })
            else: print(f"[stops_view] Warning: Skipping stop due to missing data (ID: {stop.id}, Name: {stop.name})")
        print(f"[stops_view] Returning {len(stops_serializable)} stops."); return JsonResponse({"stops": stops_serializable})
    except Exception as e: print(f"[stops_view] Error in stops_view: {e}"); traceback.print_exc(); return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def live_buses_view(request):
    """ Returns live bus data using myid as routeId. Includes lat/lon duplication workaround. """
    print("[live_buses_view] Request received at /api/bus/live/")
    try:
        print(f"[live_buses_view] Getting system with ID: {GSU_SYSTEM_ID}")
        system = getSystemFromID(GSU_SYSTEM_ID);
        if not system: return JsonResponse({"error": "System not found"}, status=404)
        print("[live_buses_view] System obtained. Attempting to get vehicles...")
        vehicles = system.getVehicles(appVersion=2); print("[live_buses_view] system.getVehicles() call completed.")
        if vehicles is None: print("[live_buses_view] system.getVehicles() returned None."); vehicles = []
        else: print(f"[live_buses_view] Number of vehicles fetched: {len(vehicles)}")

        buses_serializable = []
        print("[live_buses_view] Serializing vehicle data with Latitude/Longitude Duplication Fix...")
        for vehicle in vehicles:
            try: # Outer try for processing each vehicle
                lat = None
                lon = None
                using_workaround = False

                vehicle_id_raw = getattr(vehicle, 'id', None)
                lat_raw_original = getattr(vehicle, 'latitude', None)
                lon_raw_original = getattr(vehicle, 'longitude', None)

                if vehicle_id_raw is None:
                    print(f"[live_buses_view] Skipping vehicle. Missing essential ID.")
                    continue

                lat_to_convert = None
                lon_to_convert = None

                if lat_raw_original is None and lon_raw_original is not None:
                    print(f"[live_buses_view] WORKAROUND: Lat missing for vehicle {vehicle_id_raw}. Using 'longitude' field ({lon_raw_original}) for BOTH Lat and Lon.")
                    lat_to_convert = lon_raw_original
                    lon_to_convert = lon_raw_original
                    using_workaround = True
                elif lat_raw_original is not None and lon_raw_original is not None:
                    lat_to_convert = lat_raw_original
                    lon_to_convert = lon_raw_original
                else:
                    print(f"[live_buses_view] Skipping vehicle {vehicle_id_raw}. Missing essential coordinate data (Lat='{lat_raw_original}', Lon='{lon_raw_original}')")
                    continue

                # --- CORRECTED Try/Except block for conversion ---
                try:
                    lat = float(lat_to_convert)
                    lon = float(lon_to_convert)
                    if using_workaround:
                         print(f"  -> WORKAROUND CONVERSION: Lat={lat}, Lon={lon} (Lon is incorrect)")
                except (ValueError, TypeError) as conversion_error:
                     print(f"[live_buses_view] Error converting coordinates for vehicle {vehicle_id_raw}. Lat='{lat_to_convert}', Lon='{lon_to_convert}'. Error: {conversion_error}. Skipping.")
                     continue # Skip if conversion failed
                # --- End CORRECTED Try/Except block ---

                if lat is None or lon is None:
                     print(f"[live_buses_view] Warning: Skipping vehicle (ID: {vehicle_id_raw}) due to missing Lat/Lon after processing."); continue

                speed_raw = getattr(vehicle, 'speed', None); route_id_raw = getattr(vehicle, 'routeId', None); vehicle_name_raw = getattr(vehicle, 'name', None); route_name_raw = getattr(vehicle, 'routeName', None); color_raw = getattr(vehicle, 'color', None)
                speed = float(speed_raw) if speed_raw is not None else 0.0
                route_id = str(route_id_raw) if route_id_raw is not None else None # This is myid
                vehicle_id = str(vehicle_id_raw)

                buses_serializable.append({ "id": vehicle_id, "name": vehicle_name_raw or f"Bus {vehicle_id}", "latitude": lat, "longitude": lon, "speed": speed, "routeId": route_id, "routeName": route_name_raw or ("Not on route" if route_id is None else "Unknown Route Name"), "color": color_raw or "#808080", })

            except Exception as general_error:
                 print(f"[live_buses_view] Unexpected error processing vehicle ID {getattr(vehicle, 'id', 'UNKNOWN')}: {general_error}"); print(f"Problematic vehicle data: {getattr(vehicle, '__dict__', 'N/A')}"); traceback.print_exc(); continue

        print(f"[live_buses_view] Returning {len(buses_serializable)} buses (with potentially incorrect longitudes).")
        return JsonResponse({"buses": buses_serializable})
    except Exception as e:
        print(f"[live_buses_view] Error occurred before vehicle loop: {e}")
        traceback.print_exc()
        return JsonResponse({"error": f"An internal error occurred while fetching live bus data."}, status=500)

@csrf_exempt
def alerts_view(request):
     print("[alerts_view] Request received at /api/bus/alerts/")
     try:
        system = getSystemFromID(GSU_SYSTEM_ID);
        if not system: return JsonResponse({"error": "System not found"}, status=404)
        alerts = system.getSystemAlerts(); print(f"[alerts_view] Fetched {len(alerts)} Alerts:")
        alerts_serializable = []
        for alert in alerts: alerts_serializable.append({ "id": str(alert.id), "name": alert.name, "html": alert.html, "important": getattr(alert, 'important', '0') == '1', "dateTimeFrom": getattr(alert, 'dateTimeFrom', None), "dateTimeTo": getattr(alert, 'dateTimeTo', None), })
        print(f"[alerts_view] Returning {len(alerts_serializable)} alerts."); return JsonResponse({"alerts": alerts_serializable})
     except Exception as e: print(f"[alerts_view] Error in alerts_view: {e}"); traceback.print_exc(); return JsonResponse({"error": str(e)}, status=500)