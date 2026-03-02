import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member' | 'agent';
export type SupportedLanguage = 'en' | 'ar' | 'fr';
export type AidUrgency = 'High' | 'Medium' | 'Low';
export type Gender = 'Male' | 'Female';

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
  registrationDate?: Timestamp;
  agent?: string;
  createdAt?: Date;
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
