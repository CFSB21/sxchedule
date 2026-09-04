# Alba

Rutina diaria con estadísticas, respaldos y avisos. Empaquetada para Android.

## En el teléfono

1. En GitHub abre **Actions**, espera a que termine **APK Android**.
2. Entra en **Releases** y descarga `Alba.apk`.
3. En Android permite instalar apps de origen desconocido y ábrela.

Los avisos del APK usan alarmas del sistema: suenan aunque cierres la app.

## Datos

- Se guardan solos en el dispositivo.
- **Datos → Exportar respaldo** descarga un JSON.
- **Importar** puede reemplazar o fusionar.

## Desarrollo

```bash
npm install
npm run build:android
npx cap add android
npx cap sync android
```

`npm run build:android` genera la web que empaqueta Capacitor.
