import { logEvent } from 'firebase/analytics';
import { analytics } from '@/firebase';

function log(event: string, params?: Record<string, unknown>) {
  if (!analytics) return;
  logEvent(analytics, event, params);
}

export function trackPageView(path: string) {
  log('page_view', { page_path: path });
}

export function trackLogin(method: 'password' | 'google') {
  log('login', { method });
}

export function trackSignUp() {
  log('sign_up', { method: 'email' });
}

export function trackSubmissionCreated(online: boolean) {
  log('submission_created', { online });
}

export function trackCaseClaimed() {
  log('case_claimed');
}

export function trackDonationInitiated(amountUsd: number, fundingTarget: string) {
  log('begin_checkout', {
    currency: 'USD',
    value: amountUsd,
    items: [{ item_name: fundingTarget }],
  });
}

export function trackHousingOfferSubmitted() {
  log('housing_offer_submitted');
}

export function trackClick(label: string, destination?: string) {
  log('select_content', { content_type: 'button', item_id: label, destination });
}
