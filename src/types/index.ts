import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member' | 'agent';
export type SupportedLanguage = 'en' | 'ar' | 'fr';
export type AidUrgency = 'High' | 'Medium' | 'Low';
export type Gender = 'Male' | 'Female';
export type SubmissionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type LocationType = 'with_family' | 'center';
export type SubmissionSource = 'web' | 'agent' | 'admin' | 'migration';
export type CoverageType = 'governorate' | 'center' | 'hybrid';
export type DeliveryMode = 'delivery' | 'pickup' | 'both';
export type NotificationChannel = 'email' | 'system';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type HousingStatus = 'pending_review' | 'approved' | 'rejected' | 'reserved' | 'filled';

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
  assignedAt?: Timestamp | null;
  aidDelivered?: boolean;
  lastUpdatedBy?: string;
  staleFlagged?: boolean;
  source?: SubmissionSource;
  registrationDate?: Timestamp;
  agent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CenterDocument {
  id?: string;
  name: string;
  governorate: string;
  city: string;
  address: string;
  capacity: number;
  occupiedCapacity: number;
  contactName?: string;
  contactPhone?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HousingDocument {
  id?: string;
  hostName: string;
  hostPhone: string;
  area: string;
  address: string;
  capacity: number;
  availableSpots: number;
  priceType: 'free' | 'subsidized' | 'paid';
  notes?: string;
  status: HousingStatus;
  approvedBy?: string;
  approvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmergencyContactDocument {
  id?: string;
  name: string;
  phoneNumber: string;
  category: string;
  coverage: string;
  notes?: string;
  verified: boolean;
  lastVerifiedAt?: Date | null;
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
  submissionsRegistered: number;
  submissionsAssigned: number;
  submissionsCompleted: number;
  peopleHelped: number;
  activeNgoCount: number;
  housingAvailable: number;
  updatedAt?: Date;
}

export interface DonationDocument {
  reason: string;
  phone: string;
  timestamp: Date;
}

export interface ReduxUserData {
  uid: string;
  role: UserRole;
  validated: boolean;
  email: string;
  name: string;
  contactPersonName?: string;
  phoneNumber?: string;
  areaOfOperation?: string;
  kindOfHelp?: string;
  initiativeOrNgo?: string;
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
  consentGiven?: boolean;
  isAdmin?: boolean;
}

export interface ReduxUserSliceState {
  user: ReduxUserData | null;
  loading: boolean;
  error: string | null;
}

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
}
