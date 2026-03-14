import { logEvent } from 'firebase/analytics';
import { analytics } from '@/firebase';

export function trackPageView(path: string) {
  logEvent(analytics, 'page_view', { page_path: path });
}

export function trackLogin(method: 'password' | 'google') {
  logEvent(analytics, 'login', { method });
}

export function trackSignUp() {
  logEvent(analytics, 'sign_up', { method: 'email' });
}

export function trackSubmissionCreated(online: boolean) {
  logEvent(analytics, 'submission_created', { online });
}

export function trackCaseClaimed() {
  logEvent(analytics, 'case_claimed');
}

export function trackDonationInitiated(amountUsd: number, fundingTarget: string) {
  logEvent(analytics, 'begin_checkout', {
    currency: 'USD',
    value: amountUsd,
    items: [{ item_name: fundingTarget }],
  });
}

export function trackHousingOfferSubmitted() {
  logEvent(analytics, 'housing_offer_submitted');
}

export function trackClick(label: string, destination?: string) {
  logEvent(analytics, 'select_content', { content_type: 'button', item_id: label, destination });
}
