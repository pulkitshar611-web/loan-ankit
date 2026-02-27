const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

/**
 * Send payment confirmation email with checklist attachment
 * @param {string} toEmail - Customer email
 * @param {string} customerName - Customer name
 * @param {string} serviceName - Name of the service paid for
 */
const sendPaymentConfirmation = async (toEmail, customerName, serviceName) => {
    try {
        // Fetch current settings for the PDF path
        const settings = await Settings.findOne({ key: 'app_settings' });

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Or use SMTP settings from env
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"CL Immigration Services" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Payment Confirmation - ${serviceName}`,
            text: `Hi ${customerName},\n\nThank you for your payment for the ${serviceName} service. Please find the attached checklist document for your process.\n\nRegards,\nCL Immigration Services LLC`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
                    <h2 style="color: #1a6b8c;">Payment Successful!</h2>
                    <p>Hi <b>${customerName}</b>,</p>
                    <p>Thank you for choosing <b>CL Immigration Services LLC</b>. Your payment for <b>${serviceName}</b> has been received successfully.</p>
                    <p>We have attached the latest checklist PDF to this email for your reference. Please review it carefully.</p>
                    <br/>
                    <p style="color: #666; font-size: 13px;">Regards,<br/><b>CL Immigration Services LLC</b></p>
                </div>
            `,
            attachments: []
        };

        // Attach the PDF if it exists
        if (settings && settings.checklistPdfPath) {
            mailOptions.attachments.push({
                filename: settings.checklistPdfOriginalName || 'Immigration-Checklist.pdf',
                path: settings.checklistPdfPath
            });
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPaymentConfirmation
};
