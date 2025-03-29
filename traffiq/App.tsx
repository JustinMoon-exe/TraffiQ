// App.tsx
import { registerRootComponent } from 'expo';
import RootNavigator from './app/navigation/RootNavigator';
import BusScreen from './app/screens/BusScreen';
import HomeScreen from './app/screens/HomeScreen';

export default function App() {
  return <RootNavigator />;
}

registerRootComponent(App);