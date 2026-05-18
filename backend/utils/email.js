// utils/email.js
// Modulo de envio de emails usando Nodemailer.
// Usa configuracion del .env para no hardcodear credenciales ni acoplar
// el backend a un proveedor especifico en el codigo de las rutas.
//
// Para habilitar el envio desde Gmail:
// 1. Activar verificacion en dos pasos en la cuenta Google
// 2. Generar una "contraseña de aplicación" en myaccount.google.com/apppasswords
// 3. Usar esa contraseña en EMAIL_PASS del .env (NO la contraseña normal de Gmail)

const nodemailer = require('nodemailer');

// Envía un email si hay configuración suficiente en variables de entorno.
// Si falla la configuración o el transporte, solo registra el error porque
// la operación principal del sistema no debe bloquearse por el canal email.
async function enviarEmail({ para, asunto, html }) {
  try {
    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_PORT ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      !process.env.EMAIL_FROM
    ) {
      console.error('No se pudo enviar el email: faltan variables de entorno de email');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: para,
      subject: asunto,
      html
    });
  } catch (error) {
    console.error('No se pudo enviar el email:', error.message);
  }
}

module.exports = {
  enviarEmail
};
