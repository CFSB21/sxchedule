# Sxchedule

Rutina diaria con Year Progress Bar, estadísticas, respaldos y avisos. Empaquetada para Android.

**Versión 1.3**

## Instalar en el teléfono

1. Abre la [última versión](https://github.com/CFSB21/sxchedule/releases/latest).
2. Descarga `Sxchedule.apk`.
3. En Android permite instalar apps de origen desconocido y ábrela.
4. En **Datos → Activar avisos** concede notificaciones (y alarmas, si el sistema las pide).

Los avisos del APK usan alarmas del sistema: suenan aunque cierres la app.

## Datos

- Se guardan solos en el dispositivo.
- **Datos → Exportar respaldo** descarga (o comparte) un JSON.
- **Importar** puede reemplazar o fusionar.

## Código

Repositorio: https://github.com/CFSB21/sxchedule

Cada envío a `main` vuelve a construir el APK.

## Desarrollo

```bash
npm install
npm run build:android
npx cap add android
npx cap sync android
```

`npm run build:android` genera la web que empaqueta Capacitor.
