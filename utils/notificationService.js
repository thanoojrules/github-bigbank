const nodemailer = require('nodemailer');
const twilio = require('twilio');
const pool = require('../config/db');

// ✅ Send Email Notification
async function sendEmail(userId, message) {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows[0].email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'BigBank Alert',
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error(error);
        else console.log('Email sent: ' + info.response);
    });
}

// ✅ Send SMS Notification (via Twilio)
async function sendSMS(userId, message) {
    const userResult = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
    const userPhone = userResult.rows[0]?.phone;

    if (!userPhone) return;

    const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    client.messages
        .create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: userPhone
        })
        .then(message => console.log('SMS sent: ' + message.sid))
        .catch(error => console.error(error));
}

module.exports = { sendEmail, sendSMS };
