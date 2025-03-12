export default {
    expo: {
      name: 'TraffiQ',
      slug: 'traffiq',
      "entryPoint": "App.tsx",
      version: '1.0.0',
      orientation: 'portrait',
      plugins: [
        [
          'react-native-maps',
          {
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
          },
        ],
      ],
      extra: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  };