# TraffiQ - Travel Efficiency Maximizer for GSU

## Overview

TraffiQ is designed to maximize travel efficiency for Georgia State University (GSU) students commuting to various destinations on and off-campus. By leveraging data from multiple sources like traffic APIs, public transportation systems, and user preferences, TraffiQ aims to provide users with the most efficient routes, live transit updates, and reminders to reach their destinations on time.

The application calculates real-time, optimal commuting solutions by factoring in traffic conditions, public transit schedules, user preferences, and more. Ultimately, TraffiQ simplifies the travel process for GSU students.

## Key Features

*   **Data Aggregation:** Collects data from traffic APIs, public transit systems, and user preferences.
*   **Route Calculation:** Calculates the fastest routes based on real-time data, user preferences, and historical travel patterns.
*   **Transportation Methods:** Evaluates driving, biking, and public transit to provide the most efficient options.
*   **User Interface:** Features an intuitive and easy-to-use interface for destination input and preference settings.
*   **Real-Time Notifications:** Delivers alerts about delays, traffic changes, and alternative routes.
*   **User Data Storage:** Secure storage of user preferences and commuting history for personalized recommendations.
*   **Route Saving:** Allows users to save preferred routes for quick access.
*   **Reminders:** Notifies users when to leave for a saved route to reach their destination on time.

## Technical Details

### Frameworks
*   **Backend:** Django (Python)
*   **Frontend:** React Native (JavaScript)

### APIs Used
*   Google Maps API
*   MARTA API (Atlanta public transport)
*   GSU PassioGo API (Georgia State University public transport)

### Database
*   Firebase Realtime Database

### Hosting
*   Firebase

### Performance Requirements
*  **Real-Time Updates:** Route calculations must be provided in real-time
*  **Concurrent Users:** The app should handle up to 10,000 concurrent users without any performance degradation.
*  **Data Refresh Rate:** Data from APIs should refresh every minute for accuracy.

### Design Constraints
*   **API Rate Limits:** The app must respect the API rate limits of third-party services.
*   **Mobile Platform Compatibility:** Designed for both iOS and Android.
*   **Data Privacy:** User data must be encrypted and handled according to relevant privacy laws and standards.

### Non-Functional Requirements
*   **Security:** User data will be encrypted, and secure authentication (OAuth 2.0) will be employed.
*   **Scalability:** The system should scale to handle increasing users and data.
*   **Reliability:** The app should be available 99.9% of the time.

## User Flow Diagram

(A user flow diagram is described in the document, you can add the diagram to the README if possible)

1. Start
2. Landing Screen
3. Enter Destination
4. Transportation Preference
5. Route Suggestion
6. Live Route Updates
7. Change Transport
8. Live Transport Status
9. Change Destination
10. Add Route/Location
11. Transport/Area Filters
12. Push Notifications

## Project Team

*   **Team #:** Team 2
*   **Team Name:** TraffiQ
*   **Members:** Ashwin Prabhu, Bliena Tukue, Justice Gauldin, Justin Moonjeli, and Siddharth Gangavarapu
*   **Section:** Tuesday

## Getting Started

### Prerequisites

Before running the project, ensure you have the following installed:
*   Python 3.6+
*   Node.js and npm
*   Yarn (Optional, but recommended)
*   Android Studio (For running the Android app)
*   A working Android Virtual Machine setup

### Backend Setup (Django)

1.  **Navigate to the backend directory:**

    ```bash
    cd traffiq-backend
    ```
2.  **Create a virtual environment (optional but recommended):**

    ```bash
    python -m venv venv
    ```
3.  **Activate the virtual environment:**
    * On Windows:

      ```bash
      venv\Scripts\activate
      ```
    * On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```
4.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```
5.  **Apply database migrations:**

    ```bash
    python manage.py migrate
    ```
6.  **Start the Django development server:**

    ```bash
    python manage.py runserver
    ```

    The backend will usually be available at `http://127.0.0.1:8000/`.

### Frontend Setup (React Native)

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../traffiq-frontend
    ```
2.  **Install dependencies:**

    ```bash
    npm install
    ```
      or
    ```bash
     yarn install
    ```
3.  **Start the Android Virtual Machine**

    Open Android Studio and start your preconfigured virtual device. Make sure that it is running and available on your computer.

4. **Start the React Native development server:**

    ```bash
    npm run android
    ```

    or
    ```bash
    yarn android
    ```

    This will build the project and launch the app on your Android Virtual Machine.
