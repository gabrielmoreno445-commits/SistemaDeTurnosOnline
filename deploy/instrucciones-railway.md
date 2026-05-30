# Instrucciones de deploy - Railway (backend + MySQL)

## Pasos

1. Crear cuenta en https://railway.app
2. Nuevo proyecto -> "Deploy from GitHub repo"
3. Seleccionar el repositorio SistemaDeTurnosOnline
4. Configurar el directorio raiz: `backend`
5. Railway detecta Node.js automaticamente

## Agregar MySQL

1. En el proyecto -> "Add Plugin" -> MySQL
2. Railway crea la base de datos y genera las variables de conexion
3. Copiar los valores: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

## Variables de entorno en Railway

Ir a Variables y agregar:

- PORT=4000
- DB_HOST=[valor de MYSQL_HOST generado por Railway]
- DB_USER=[valor de MYSQL_USER]
- DB_PASSWORD=[valor de MYSQL_PASSWORD]
- DB_NAME=[valor de MYSQL_DATABASE]
- JWT_SECRET=[clave aleatoria larga y segura]
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_USER=[tu cuenta Gmail]
- EMAIL_PASS=[contrasena de aplicacion Gmail]
- FRONTEND_URL=[URL de Vercel del panel-admin, se obtiene despues de deployar]
- SITIO_URL=[URL de Vercel del sitio-publico, se obtiene despues de deployar]

## Aplicar el schema de la base de datos

Una vez que MySQL este corriendo en Railway:

1. Ir a la pestana "Data" del plugin MySQL
2. Ejecutar el contenido de `database/schema.sql`

## URL final del backend

Railway asigna una URL del tipo:

`https://sistemadeturnosonline-production.up.railway.app`

Guardar esta URL: se usa en las variables de entorno de Vercel.
