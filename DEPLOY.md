# Guía de Deploy en AWS Amplify

## Problemas Resueltos

### 1. Error de TypeScript en ReminderExecutionItem
**Problema:** La prop `execution` no existía en el componente, debía ser `reminder`.
**Solución:** Corregido en `app/(dashboard)/reminders/[id]/page.tsx` línea 325.

### 2. Error de TypeScript en ReminderCardCompact
**Problema:** El tipo `reminder.id` puede ser `string | number` pero las funciones esperaban solo `string`.
**Solución:** Agregado `String()` para convertir el ID en las líneas 121, 135 y 149 de `components/reminders/ReminderCardCompact.tsx`.

### 3. Error de Memoria en Node.js (SIGTRAP)
**Problema:** El build de Next.js consume mucha memoria y causa un crash en Amplify.
**Solución:** 
- Agregado `NODE_OPTIONS="--max-old-space-size=4096"` en `amplify.yml`
- Optimizado el archivo de configuración de Amplify

### 4. Vulnerabilidad de Seguridad en Next.js
**Problema:** Next.js 16.0.7 tiene una vulnerabilidad de seguridad.
**Solución:** Actualizado a Next.js ^16.1.6 en `package.json`.

## Archivos Creados/Modificados

1. **amplify.yml** - Configuración de build para AWS Amplify con optimizaciones de memoria
2. **.npmrc** - Configuración de pnpm para mejor compatibilidad
3. **package.json** - Actualizado Next.js a versión segura
4. **app/(dashboard)/reminders/[id]/page.tsx** - Corregido error de props
5. **components/reminders/ReminderCardCompact.tsx** - Corregido error de tipos

## Pasos para Deploy

1. **Commit y Push de los cambios:**
   ```bash
   git add .
   git commit -m "fix: Corregir errores de TypeScript y optimizar build para Amplify"
   git push origin main
   ```

2. **En AWS Amplify Console:**
   - El deploy se iniciará automáticamente
   - Verifica que use el archivo `amplify.yml`
   - El build debería completarse exitosamente ahora

3. **Variables de Entorno en Amplify:**
   Asegúrate de tener configuradas estas variables en la consola de Amplify:
   - `NEXT_PUBLIC_API_URL=https://us-api.agendyfix.com/api/v1`
   - `NEXT_PUBLIC_WS_URL=wss://us-api.agendyfix.com`
   - `NEXT_PUBLIC_APP_NAME=AgendyFix`
   - `NEXT_PUBLIC_APP_URL=https://app.agendyfix.com`

## Configuración de Amplify

El archivo `amplify.yml` incluye:
- Instalación global de pnpm
- Instalación de dependencias con `--frozen-lockfile`
- Optimización de memoria con `NODE_OPTIONS`
- Cache de `.next/cache` y `node_modules`

## Troubleshooting

### Si el build sigue fallando por memoria:
1. En AWS Amplify Console, ve a "Build settings"
2. Cambia el "Build image" a una versión más reciente
3. O solicita aumentar los recursos de build en AWS Support

### Si hay errores de TypeScript:
1. Ejecuta localmente: `pnpm run build`
2. Corrige cualquier error que aparezca
3. Haz commit y push de los cambios

### Si hay problemas con pnpm:
1. Verifica que el archivo `.npmrc` esté en el repositorio
2. Asegúrate de que `amplify.yml` instale pnpm globalmente

## Verificación Post-Deploy

Una vez que el deploy sea exitoso:
1. Verifica que la aplicación cargue en la URL de Amplify
2. Prueba el login
3. Verifica que las llamadas a la API funcionen correctamente
4. Revisa la consola del navegador para errores

## Notas Importantes

- **No es difícil** - Los errores eran simples problemas de tipos de TypeScript
- El error de memoria es común en builds de Next.js y se resuelve con la configuración de NODE_OPTIONS
- Todos los errores críticos han sido corregidos
- El código ahora compila correctamente con TypeScript