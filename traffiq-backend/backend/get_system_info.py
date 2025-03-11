import passiogo

def get_gsu_system():
    """
    Retrieves the TransportationSystem object for Georgia State University.
    """
    # From the provided text, Georgia State University's system ID is 480
    system_id = 480
    system = passiogo.getSystemFromID(system_id)
    if system:
        print(f"System Name: {system.name}")
        print(f"System ID: {system.id}")
        return system
    else:
        print(f"Could not retrieve system information for ID: {system_id}")
        return None

if __name__ == "__main__":
    gsu_system = get_gsu_system()
    if gsu_system:
        print("\nFull System Object Dictionary:")
        print(gsu_system.__dict__)