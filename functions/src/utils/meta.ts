import { logger } from 'firebase-functions';

/**
 * Sends a free-form WhatsApp text message via Meta Cloud API.
 *
 * IMPORTANT: Meta only allows free-form text within 24h of a user-initiated message.
 * For outbound notifications outside that window, use sendWhatsAppTemplate instead.
 *
 * @param to - E.164 phone number WITHOUT '+' prefix (Meta Cloud API format)
 * @param body - Message text
 */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing META_WA_PHONE_NUMBER_ID or META_WA_ACCESS_TOKEN');
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      // PII: 'to' is a phone number — never log this value
      to,
      type: 'text',
      text: { body },
    }),
  });

  if (!response.ok) {
    // Never log 'to' (PII)
    logger.error('Meta sendWhatsAppText failed', { status: response.status });
    throw new Error(`Meta API error: ${response.status}`);
  }
}

/**
 * Sends a WhatsApp template message via Meta Cloud API.
 * Required for business-initiated conversations outside the 24h user-message window.
 * The template must be approved in Meta Business Manager before use.
 *
 * @param to - E.164 phone number WITHOUT '+' prefix
 * @param templateName - Approved Meta template name
 * @param langCode - BCP 47 language code ('ar', 'en', 'fr')
 * @param bodyParams - Positional {{1}}, {{2}}, ... text parameters for the template body
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  langCode: string,
  bodyParams: string[],
): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing META_WA_PHONE_NUMBER_ID or META_WA_ACCESS_TOKEN');
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      // PII: 'to' is a phone number — never log this value
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: langCode },
        components: [
          {
            type: 'body',
            parameters: bodyParams.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    // Never log 'to' (PII)
    logger.error('Meta sendWhatsAppTemplate failed', { status: response.status, templateName });
    throw new Error(`Meta API error: ${response.status}`);
  }
}
