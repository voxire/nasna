import twilio from 'twilio';

function getTwilioClient(): twilio.Twilio {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Missing Twilio credentials in environment variables');
  }
  return twilio(sid, token);
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error('Missing TWILIO_WHATSAPP_FROM environment variable');
  }
  await client.messages.create({ body, from, to });
}
