import passiogo

def get_gsu_data():
    """
    Retrieves routes, stops, and alerts for Georgia State University.
    """
    system_id = 480 # gsu sys id
    system = passiogo.getSystemFromID(system_id)

    if system:
        print(f"Fetching data for: {system.name} (ID: {system.id})")

        # Get Routes
        routes = system.getRoutes()
        print(f"\n--- Routes ({len(routes)} found) ---")
        if routes:
            for route in routes: 
                print(f"  Route Name: {route.name}, Short Name: {route.shortName}, ID: {route.id}")
                # print(f"  Route Details: {route.__dict__}")
        else:
            print("  No routes found.")

        # Get Stops
        stops = system.getStops()
        print(f"\n--- Stops ({len(stops)} found) ---")
        if stops:
            for stop in stops: 
                print(f"  Stop Name: {stop.name}, ID: {stop.id}, Latitude: {stop.latitude}, Longitude: {stop.longitude}")
                # print(f"  Stop Details: {stop.__dict__}")
        else:
            print("  No stops found.")

        alerts = system.getSystemAlerts()
        print(f"\n--- System Alerts ({len(alerts)} found) ---")
        if alerts:
            for alert in alerts[:5]: 
                print(f"  Alert Name: {alert.name}, ID: {alert.id}")
                print(f"  Alert Message: {alert.html}") 
                # print(f"  Alert Details: {alert.__dict__}")
        else:
            print("  No system alerts found.")

    else:
        print(f"Could not retrieve system information for ID: {system_id}")

if __name__ == "__main__":
    get_gsu_data()