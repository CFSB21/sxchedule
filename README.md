# Sxchedule

Rutina diaria con estadísticas, respaldos, avisos y modo oscuro. Empaquetada para Android.

## Instalar en el teléfono

1. Abre la [última versión](https://github.com/CFSB21/alba-rutina/releases/latest).
2. Descarga `Sxchedule.apk`.
3. En Android permite instalar apps de origen desconocido y ábrela.
4. En **Datos → Activar avisos** concede notificaciones (y alarmas, si el sistema las pide).

Los avisos del APK usan alarmas del sistema: suenan aunque cierres la app.

## Datos

- Se guardan solos en el dispositivo.
- **Datos → Exportar respaldo** descarga (o comparte) un JSON.
- **Importar** puede reemplazar o fusionar.

## Código

Repositorio: https://github.com/CFSB21/alba-rutina

Cada envío a `main` vuelve a construir el APK.

## Desarrollo

```bash
npm install
npm run build:android
npx cap add android
npx cap sync android
```

`npm run build:android` genera la web que empaqueta Capacitor.
