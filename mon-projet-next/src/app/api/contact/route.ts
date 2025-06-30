import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your app password
  },
};

// Create transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransport(EMAIL_CONFIG);
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Email configuration error');
  }
};

// Email templates
const createEmailTemplate = (data: any) => {
  return {
    subject: `[Contact GelHydro] ${data.sujet}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nouveau message de contact</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 20px 0; }
            .info-label { font-weight: bold; color: #4f46e5; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
            .timestamp { background: #e0f2fe; padding: 10px; border-radius: 5px; font-size: 12px; color: #0369a1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Nouveau Message de Contact</h1>
              <p>Vous avez reçu un nouveau message depuis votre site GelHydro</p>
            </div>
            
            <div class="content">
              <div class="timestamp">
                📅 Reçu le: ${new Date().toLocaleString('fr-FR', { 
                  timeZone: 'Africa/Douala',
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </div>
              
              <div class="info-grid">
                <div class="info-label">👤 Nom:</div>
                <div><strong>${data.nom}</strong></div>
                
                <div class="info-label">📧 Email:</div>
                <div><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></div>
                
                <div class="info-label">📋 Sujet:</div>
                <div><span style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; color: #1e40af;">${data.sujet}</span></div>
              </div>
              
              <div class="message-box">
                <h3 style="margin-top: 0; color: #1e40af;">💬 Message:</h3>
                <p style="white-space: pre-wrap; margin: 0;">${data.message}</p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">🚀 Action recommandée:</h4>
                <p style="margin: 0; color: #92400e;">
                  Répondez à <strong>${data.nom}</strong> dans les plus brefs délais à l'adresse: 
                  <a href="mailto:${data.email}" style="color: #92400e; text-decoration: underline;">${data.email}</a>
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>📱 Ce message a été envoyé depuis le formulaire de contact de <strong>GelHydro</strong></p>
              <p>🌐 Site web: <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://gelhydro.com'}" style="color: #2563eb;">GelHydro.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Nouveau message de contact - GelHydro

Nom: ${data.nom}
Email: ${data.email}
Sujet: ${data.sujet}

Message:
${data.message}

Reçu le: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })}

---
Ce message a été envoyé depuis le formulaire de contact de GelHydro.
Répondez à ${data.nom} à l'adresse: ${data.email}
    `
  };
};

// Auto-reply template
const createAutoReplyTemplate = (data: any) => {
  return {
    subject: `Confirmation de réception - Votre message à GelHydro`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmation de réception</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-summary { background: white; padding: 20px; border-radius: 8px; border: 1px solid #d1fae5; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #bbf7d0; color: #065f46; font-size: 14px; }
            .contact-info { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Message bien reçu !</h1>
              <p>Merci de nous avoir contactés</p>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${data.nom}</strong>,</p>
              
              <p>Nous avons bien reçu votre message concernant "<strong>${data.sujet}</strong>" et nous vous remercions de votre intérêt pour GelHydro.</p>
              
              <div class="message-summary">
                <h3 style="margin-top: 0; color: #059669;">📋 Récapitulatif de votre message:</h3>
                <p><strong>Sujet:</strong> ${data.sujet}</p>
                <p><strong>Date d'envoi:</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })}</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <p style="margin: 0; font-style: italic;">"${data.message.substring(0, 150)}${data.message.length > 150 ? '...' : ''}"</p>
                </div>
              </div>
              
              <p>🕐 <strong>Délai de réponse:</strong> Notre équipe vous répondra dans les <strong>24-48 heures</strong> ouvrables.</p>
              
              <div class="contact-info">
                <h4 style="margin-top: 0; color: #065f46;">📞 Besoin d'une réponse plus rapide ?</h4>
                <p style="margin: 5px 0;">📧 Email: <a href="mailto:kamenimanuella932@gmail.com" style="color: #059669;">kamenimanuella932@gmail.com</a></p>
                <p style="margin: 5px 0;">📱 Téléphone: <a href="tel:+237659556885" style="color: #059669;">+237 659 556 885</a></p>
                <p style="margin: 5px 0;">💬 WhatsApp: <a href="https://wa.me/237659556885" style="color: #059669;">+237 659 556 885</a></p>
                <p style="margin: 5px 0;">🕒 Horaires: Lun-Ven 8h-18h, Sam 9h-15h</p>
              </div>
              
              <p>Cordialement,<br/>
              <strong>L'équipe GelHydro</strong><br/>
              <em>Votre partenaire santé au Cameroun</em></p>
            </div>
            
            <div class="footer">
              <p>💊 <strong>GelHydro</strong> - Votre pharmacie de confiance</p>
              <p>📍 Douala, Cameroun</p>
              <p style="font-size: 12px; color: #6b7280;">Ce message a été envoyé automatiquement. Merci de ne pas répondre à cet email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.nom},

Nous avons bien reçu votre message concernant "${data.sujet}" et nous vous remercions de votre intérêt pour GelHydro.

Notre équipe vous répondra dans les 24-48 heures ouvrables.

Récapitulatif de votre message:
- Sujet: ${data.sujet}
- Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })}

Besoin d'une réponse plus rapide ?
Email: kamenimanuella932@gmail.com
Téléphone: +237 659 556 885
WhatsApp: +237 659 556 885
Horaires: Lun-Ven 8h-18h, Sam 9h-15h

Cordialement,
L'équipe GelHydro
Votre partenaire santé au Cameroun

---
GelHydro - Votre pharmacie de confiance
Douala, Cameroun
    `
  };
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    const { nom, email, sujet, message } = data;
    
    if (!nom || !email || !sujet || !message) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing');
      return NextResponse.json(
        { success: false, error: 'Configuration email manquante sur le serveur' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur de configuration email' },
        { status: 500 }
      );
    }

    // Prepare emails
    const adminEmail = createEmailTemplate(data);
    const autoReply = createAutoReplyTemplate(data);

    // Send email to admin
    const adminMailOptions = {
      from: {
        name: 'GelHydro Contact Form',
        address: process.env.EMAIL_USER!,
      },
      to: process.env.EMAIL_USER, // Send to your email
      replyTo: email, // Allow direct reply to customer
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    };

    // Send auto-reply to customer
    const autoReplyMailOptions = {
      from: {
        name: 'GelHydro',
        address: process.env.EMAIL_USER!,
      },
      to: email, // Send to customer
      subject: autoReply.subject,
      html: autoReply.html,
      text: autoReply.text,
    };

    // Send both emails
    const [adminResult, autoReplyResult] = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(autoReplyMailOptions),
    ]);

    // Check results
    const adminSuccess = adminResult.status === 'fulfilled';
    const autoReplySuccess = autoReplyResult.status === 'fulfilled';

    if (!adminSuccess) {
      console.error('Failed to send admin email:', adminResult.reason);
    }

    if (!autoReplySuccess) {
      console.error('Failed to send auto-reply:', autoReplyResult.reason);
    }

    // Return success if at least admin email was sent
    if (adminSuccess) {
      console.log(`Contact form email sent successfully from ${email}`);
      return NextResponse.json({
        success: true,
        message: 'Message envoyé avec succès ! Nous vous répondrons bientôt.',
        details: {
          adminEmailSent: adminSuccess,
          autoReplySent: autoReplySuccess,
        }
      });
    } else {
      throw new Error('Failed to send admin notification email');
    }

  } catch (error: any) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
