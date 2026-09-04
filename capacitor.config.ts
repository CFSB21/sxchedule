import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.alba.rutina",
  appName: "Sxchedule",
  webDir: "android-www",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#2F4A40",
    },
  },
};

export default config;
