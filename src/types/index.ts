import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member' | 'agent';
export type SupportedLanguage = 'en' | 'ar' | 'fr';
export type AidUrgency = 'High' | 'Medium' | 'Low';
export type Gender = 'Male' | 'Female';
export type SubmissionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type LocationType = 'with_family' | 'center';
export type SubmissionSource = 'web' | 'agent' | 'admin' | 'migration' | 'whatsapp';
export type CoverageType = 'governorate' | 'center' | 'hybrid';
export type DeliveryMode = 'delivery' | 'pickup' | 'both';
export type NotificationChannel = 'email' | 'system';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type HousingStatus = 'pending_review' | 'available' | 'reserved' | 'filled';

export interface AidDeliveryRecord {
  type: string;
  date: Timestamp;
  deliveredBy: string;
  notes?: string;
}

export interface AgeRanges {
  '0-3': number;
  '4-12': number;
  '13-18': number;
  '19-60': number;
  '60+': number;
}

export interface MemberDocument {
  uid: string;
  name: string;
  contactPersonName?: string;
  email: string;
  phoneNumber: string;
  areaOfOperation?: string;
  kindOfHelp?: string;
  initiativeOrNgo?: string;
  role: UserRole;
  numberOfVolunteers?: string;
  isOfficiallyRegistered?: boolean;
  coverageType?: CoverageType;
  coverageGovernorates?: string[];
  coverageCenterIds?: string[];
  aidTypes?: string[];
  currentCaseLoad?: number;
  maxCaseLoad?: number;
  deliveryMode?: DeliveryMode;
  onboarded?: boolean;
  consentGiven: boolean;
  isAdmin: boolean;
  validated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionDocument {
  id?: string;
  fullName: string;
  phoneNumber: string;
  // PII: admin + Cloud Functions only. Never return to member-facing queries.
  whatsappPhone?: string;
  emailAddress: string;
  gender: Gender;
  currentGovernorate: string;
  previousGovernorate: string;
  street: string;
  building: string;
  floor: string;
  city: string;
  ageRanges: AgeRanges;
  specialNeeds: string[];
  needs: string[];
  aidUrgency: AidUrgency;
  consentGiven: boolean;
  comments: string;
  numberOfPeopleInHousehold: number;
  status?: SubmissionStatus;
  locationType?: LocationType;
  centerId?: string;
  assignedTo?: string;
  // PII: admin + member via Cloud Functions only. Never expose to agents.
  assignedToOrgName?: string;
  assignedAt?: Timestamp | null;
  aidDelivered?: boolean;
  aidDeliveries?: AidDeliveryRecord[];
  lastUpdatedBy?: string;
  staleFlagged?: boolean;
  source?: SubmissionSource;
  registrationDate?: Timestamp;
  agent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CenterType = 'school' | 'university' | 'community_hall' | 'sports_facility' | 'other';
export type CenterFacility =
  | 'generator'
  | 'water'
  | 'kitchen'
  | 'medical_room'
  | 'bathrooms'
  | 'internet';

export interface CenterDocument {
  id?: string;
  name: string;
  type: CenterType;
  governorate: string;
  district?: string;
  address?: string;
  // stored as plain object (not Firestore GeoPoint) for Leaflet compatibility
  coordinates?: { lat: number; lng: number };
  totalCapacity: number;
  currentOccupancy: number;
  facilities?: CenterFacility[];
  // public contact number — NOT PII, safe to show to all users
  phone?: string;
  // e.g. ['food', 'medical', 'clothing']
  aidServices?: string[];
  // e.g. "Mon–Fri 8:00–17:00"
  operatingHours?: string;
  // true = accepting new arrivals; false = full/closed
  intakeOpen?: boolean;
  // PII: admin only. Never expose to members, agents, or public.
  managerName?: string;
  // PII: admin only. Never expose to members, agents, or public.
  managerPhone?: string;
  active: boolean;
  isActive?: boolean;
  capacity?: number;
  occupiedCapacity?: number;
  createdBy: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export type HousingType = 'apartment' | 'room' | 'house' | 'floor';
export type HousingPriceType = 'free' | 'subsidized' | 'market_rate';
export type HousingAmenity =
  | 'generator'
  | 'water'
  | 'internet'
  | 'washing_machine'
  | 'furnished'
  | 'private_bathroom';

export interface HousingDocument {
  id?: string;
  listerId: string; // UID or 'anonymous'
  // PII: admin only. Never expose to members, agents, or public.
  listerName: string;
  // PII: admin only. Never expose to members, agents, or public.
  listerPhone: string;
  type: HousingType;
  governorate: string;
  district?: string;
  capacity: number;
  priceType: HousingPriceType;
  pricePerMonth?: number; // USD, 0 for free
  availableFrom: Timestamp;
  availableUntil?: Timestamp;
  amenities?: HousingAmenity[];
  description?: string;
  status: HousingStatus;
  approvedBy?: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export type EmergencyContactCategory =
  | 'government'
  | 'health'
  | 'ngo'
  | 'security'
  | 'legal'
  | 'utilities'
  | 'medical'
  | 'shelter'
  | 'food'
  | 'protection';

export interface EmergencyContactDocument {
  id?: string;
  name: string;
  phoneNumber: string;
  phoneAlt?: string;
  category: EmergencyContactCategory | string;
  coverage: string;
  notes?: string;
  verified: boolean;
  lastVerifiedAt?: Date | null;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationDocument {
  id?: string;
  recipientUid: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  relatedSubmissionId?: string;
  createdAt?: Date;
  sentAt?: Date | null;
}

export interface GlobalStatsDocument {
  totalRegistered: number;
  totalAssigned: number;
  totalCompleted: number;
  totalPeopleHelped: number;
  totalPending: number;
  activeNGOs: number;
  housingAvailable: number;
  byGovernorate: Record<string, number>;
  byNeed: Record<string, number>;
  lastUpdatedAt?: Timestamp | Date;
}

export interface StatsSnapshotDocument {
  date: string; // YYYY-MM-DD
  totalRegistered: number;
  totalAssigned: number;
  totalCompleted: number;
  totalPeopleHelped: number;
  totalPending: number;
  snapshotAt: Timestamp | Date;
}

export interface DonationDocument {
  id?: string;
  reason: string;
  fundingTarget: 'family' | 'center' | 'ngo';
  donorPhone: string;
  donorName: string;
  amountUsd: number;
  status: 'checkout_created' | 'paid' | 'failed';
  stripeSessionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// PII: Cloud Functions service account only. Never expose to client.
export type BotStep =
  | 'new'
  | 'awaiting_name'
  | 'awaiting_area'
  | 'awaiting_household'
  | 'awaiting_need'
  | 'complete'
  | 'status_check';

export type BotLanguage = 'ar' | 'en' | 'fr';

export interface WaSessionDocument {
  // PII: Cloud Functions only
  phone: string;
  step: BotStep;
  language: BotLanguage;
  data: {
    // PII: Cloud Functions only
    name?: string;
    area?: string;
    householdSize?: number;
    mainNeed?: string;
  };
  submissionId?: string; // set after registration completes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
}
