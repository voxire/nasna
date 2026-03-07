import sgMail from '@sendgrid/mail';
import { logger } from 'firebase-functions';

// Set via: firebase functions:secrets:set SENDGRID_API_KEY
// Set via: firebase functions:secrets:set ADMIN_EMAIL

interface NgoNewCaseAlertOptions {
  recipientEmail: string;
  recipientName: string;
  governorate: string;
  needs: string[];
  urgency: string;
  caseCount: number;
}

interface AdminStaleCasesAlertOptions {
  adminEmail: string;
  staleCaseIds: string[];
  staleCaseCount: number;
}

function getSendGridApiKey(): string | null {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    logger.warn('SENDGRID_API_KEY is not set — skipping email send');
    return null;
  }
  return key;
}

export async function sendNgoNewCaseAlert(options: NgoNewCaseAlertOptions): Promise<void> {
  const apiKey = getSendGridApiKey();
  if (!apiKey) return;

  sgMail.setApiKey(apiKey);

  const needsList = options.needs.length > 0 ? options.needs.join(', ') : 'unspecified';
  const subject = `New case in ${options.governorate} — ${options.urgency} urgency`;

  await sgMail.send({
    to: options.recipientEmail,
    from: process.env.ADMIN_EMAIL ?? 'noreply@nasna.org',
    subject,
    text: [
      `Hello ${options.recipientName},`,
      '',
      `A new case has been submitted in your coverage area.`,
      '',
      `Governorate: ${options.governorate}`,
      `Needs: ${needsList}`,
      `Urgency: ${options.urgency}`,
      `Pending cases in your area: ${options.caseCount}`,
      '',
      'Please log in to the Nasna platform to review and claim this case.',
    ].join('\n'),
    html: [
      `<p>Hello ${options.recipientName},</p>`,
      `<p>A new case has been submitted in your coverage area.</p>`,
      `<ul>`,
      `<li><strong>Governorate:</strong> ${options.governorate}</li>`,
      `<li><strong>Needs:</strong> ${needsList}</li>`,
      `<li><strong>Urgency:</strong> ${options.urgency}</li>`,
      `<li><strong>Pending cases in your area:</strong> ${options.caseCount}</li>`,
      `</ul>`,
      `<p>Please log in to the Nasna platform to review and claim this case.</p>`,
    ].join('\n'),
  });

  logger.info('Sent NGO new case alert email', {
    recipientEmail: options.recipientEmail,
    governorate: options.governorate,
  });
}

export async function sendAdminStaleCasesAlert(
  options: AdminStaleCasesAlertOptions,
): Promise<void> {
  const apiKey = getSendGridApiKey();
  if (!apiKey) return;

  sgMail.setApiKey(apiKey);

  const caseList = options.staleCaseIds.map((id) => `• ${id}`).join('\n');
  const caseListHtml = options.staleCaseIds.map((id) => `<li>${id}</li>`).join('\n');

  await sgMail.send({
    to: options.adminEmail,
    from: process.env.ADMIN_EMAIL ?? 'noreply@nasna.org',
    subject: `${options.staleCaseCount} stale case(s) require attention`,
    text: [
      `${options.staleCaseCount} case(s) have had no activity for over 24 hours:`,
      '',
      caseList,
      '',
      'Please log in to the Nasna admin panel to review these cases.',
    ].join('\n'),
    html: [
      `<p><strong>${options.staleCaseCount}</strong> case(s) have had no activity for over 24 hours:</p>`,
      `<ul>${caseListHtml}</ul>`,
      `<p>Please log in to the Nasna admin panel to review these cases.</p>`,
    ].join('\n'),
  });

  logger.info('Sent admin stale cases alert email', {
    staleCaseCount: options.staleCaseCount,
  });
}
