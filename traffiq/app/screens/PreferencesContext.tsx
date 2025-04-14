import React from 'react';

type RoutingPreferences = {
  prioritizeShuttles: boolean;
  useMARTA: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
};

export const PreferencesContext = React.createContext<{
  preferences: RoutingPreferences;
  setPreferences: (prefs: RoutingPreferences) => void;
}>({
  preferences: {
    prioritizeShuttles: true,
    useMARTA: true,
    avoidHighways: false,
    avoidTolls: false
  },
  setPreferences: () => {}
});