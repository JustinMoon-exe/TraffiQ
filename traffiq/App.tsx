// App.tsx
import { registerRootComponent } from 'expo';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}

registerRootComponent(App);