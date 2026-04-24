/**
 * Notification Service for RB SOROCABA
 * Handles Email and WhatsApp notifications for visit updates.
 */

interface NotificationPayload {
  to_name: string;
  to_email: string;
  to_phone: string;
  property_title: string;
  visit_date: string;
  visit_time: string;
  visit_id?: string;
}

export const sendVisitConfirmationNotification = async (payload: NotificationPayload) => {
  const { to_name, to_email, to_phone, property_title, visit_date, visit_time, visit_id } = payload;

  console.log(`[NotificationService] Sending confirmation to ${to_name}...`);

  // 1. WhatsApp Notification (Logic)
  let waMessage = `Olá ${to_name}! Sua visita para o imóvel "${property_title}" no dia ${visit_date} às ${visit_time} foi CONFIRMADA pela RB Sorocaba Negócios Imobiliários. Estamos ansiosos para te atender!`;
  
  if (visit_id) {
    const confirmLink = `${window.location.origin}/?confirm_visit=${visit_id}`;
    waMessage += `\n\n------------------------------\n*📍 CONFIRMAÇÃO DE SEGURANÇA*\n\nPara validar seu atendimento em nosso sistema oficial, por favor clique no link abaixo:\n\n🔗 ${confirmLink}\n\n_🔐 Site seguro da RB Sorocaba Negócios Imobiliários_`;
  }
  
  // Direct WhatsApp link as fallback since there's no server-side API
  const waLink = `https://wa.me/${to_phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;
  
  try {
    // We attempt the local API first (in case the user eventually adds it)
    const waResponse = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to_phone, message: waMessage })
    }).catch(() => ({ ok: false })); 

    if (waResponse.ok) {
       console.log('WhatsApp notification sent successfully via API.');
    } else {
       // Automatic redirect if API is missing - this is the "No API" solution
       window.open(waLink, '_blank');
    }

    // 2. Email Notification (Logic)
    // Professional environment: Use SendGrid, Postmark, or Firebase Trigger Email extension
    const emailResponse = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: to_email, 
        subject: 'Visita Confirmada - RB Sorocaba',
        message: waMessage // Simple message for demo
      })
    }).catch(() => ({ ok: false }));

    if (emailResponse.ok) {
      console.log('Email notification sent successfully via API.');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error };
  }
};
