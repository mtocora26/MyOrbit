import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App instalable de MyOrbit (Android). Empaqueta el build de Vite en modo `android` (`pnpm build:android`).
 * El id de la app es permanente una vez publicada en una tienda: cámbialo ahora o nunca.
 */
const config: CapacitorConfig = {
  appId: "com.app.myorbit",
  appName: "MyOrbit",
  webDir: "dist",
  android: {
    // El WebView sirve la app en https://localhost: ese origen debe estar en MYORBIT_CORS_ALLOWED_ORIGINS (backend).
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Se oculta en cuanto React pinta (hideSplash en App.tsx); si algo falla, a los 3 s para no quedar atascado.
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: "#0e1626",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
