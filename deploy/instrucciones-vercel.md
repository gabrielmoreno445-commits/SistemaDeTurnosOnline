# Instrucciones de deploy - Vercel (frontends)

## Sitio publico (Astro)

1. Ir a https://vercel.com -> New Project
2. Importar el repositorio SistemaDeTurnosOnline
3. Configurar:
   - Framework: Astro (detectado automaticamente)
   - Root directory: `sitio-publico`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Variables de entorno:
   - API_URL = https://tu-backend.railway.app
   - PUBLIC_API_URL = https://tu-backend.railway.app
5. Deploy

## Panel admin (Vue SPA)

1. En Vercel -> Add New Project (mismo repo, distinto proyecto)
2. Configurar:
   - Framework: Vite
   - Root directory: `panel-admin`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Variables de entorno:
   - VITE_API_URL = https://tu-backend.railway.app
4. Deploy

## Despues del deploy

1. Copiar las URLs de Vercel
2. Volver a Railway -> Variables de entorno
3. Actualizar FRONTEND_URL y SITIO_URL con las URLs reales de Vercel
4. Railway hace redeploy automatico con las nuevas variables
5. Verificar el flujo completo desde las URLs de produccion
