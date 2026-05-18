// db/connection.js
// Crea y exporta un pool de conexiones a MySQL para todo el backend.
// Depende de dotenv para leer las credenciales del entorno y de mysql2/promise
// para trabajar con async/await en las rutas sin envolver callbacks manualmente.

const mysql = require('mysql2/promise');

// Se usa pool en lugar de una conexion unica porque el servidor puede recibir
// multiples requests al mismo tiempo. Cada ruta pide una conexion al pool cuando
// ejecuta una consulta, y mysql2 la libera automaticamente al finalizar.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
