import type { ContactType } from '@/types';

export interface OfficialNumber {
  label: string;
  phone: string;
  type: ContactType;
  primary?: boolean;
}

const EU_112: OfficialNumber[] = [{ label: 'Emergency (all services)', phone: '112', type: 'other', primary: true }];

/**
 * Official public emergency numbers by ISO 3166-1 alpha-2 country code.
 * Sources: national government / ITU listings. Keep this list conservative:
 * only add numbers that are nationally valid.
 */
const NUMBERS: Record<string, OfficialNumber[]> = {
  US: [
    { label: 'Emergency (police, fire, ambulance)', phone: '911', type: 'other', primary: true },
    { label: 'Suicide & Crisis Lifeline', phone: '988', type: 'helpline' },
    { label: 'Poison Control', phone: '1-800-222-1222', type: 'medical' },
  ],
  CA: [
    { label: 'Emergency (police, fire, ambulance)', phone: '911', type: 'other', primary: true },
    { label: 'Suicide Crisis Helpline', phone: '988', type: 'helpline' },
  ],
  MX: [{ label: 'Emergency (all services)', phone: '911', type: 'other', primary: true }],
  GB: [
    { label: 'Emergency (police, fire, ambulance)', phone: '999', type: 'other', primary: true },
    { label: 'Emergency (EU standard)', phone: '112', type: 'other' },
    { label: 'NHS non-emergency medical', phone: '111', type: 'medical' },
    { label: 'Police non-emergency', phone: '101', type: 'police' },
  ],
  IE: [
    { label: 'Emergency (all services)', phone: '112', type: 'other', primary: true },
    { label: 'Emergency (alternative)', phone: '999', type: 'other' },
  ],
  DE: [
    { label: 'Fire & ambulance', phone: '112', type: 'fire', primary: true },
    { label: 'Police', phone: '110', type: 'police', primary: true },
  ],
  FR: [
    { label: 'Emergency (EU standard)', phone: '112', type: 'other', primary: true },
    { label: 'Medical (SAMU)', phone: '15', type: 'medical' },
    { label: 'Police', phone: '17', type: 'police' },
    { label: 'Fire', phone: '18', type: 'fire' },
  ],
  IT: [
    { label: 'Emergency (EU standard)', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '113', type: 'police' },
    { label: 'Fire', phone: '115', type: 'fire' },
    { label: 'Ambulance', phone: '118', type: 'medical' },
  ],
  CH: [
    { label: 'Emergency (EU standard)', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '117', type: 'police' },
    { label: 'Fire', phone: '118', type: 'fire' },
    { label: 'Ambulance', phone: '144', type: 'medical' },
  ],
  AT: [
    { label: 'Emergency (EU standard)', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '133', type: 'police' },
    { label: 'Fire', phone: '122', type: 'fire' },
    { label: 'Ambulance', phone: '144', type: 'medical' },
  ],
  NO: [
    { label: 'Police', phone: '112', type: 'police', primary: true },
    { label: 'Fire', phone: '110', type: 'fire' },
    { label: 'Ambulance', phone: '113', type: 'medical' },
  ],
  PL: [
    { label: 'Emergency (EU standard)', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '997', type: 'police' },
    { label: 'Fire', phone: '998', type: 'fire' },
    { label: 'Ambulance', phone: '999', type: 'medical' },
  ],
  ES: EU_112, PT: EU_112, NL: EU_112, BE: EU_112, SE: EU_112, DK: EU_112, FI: EU_112, GR: EU_112,
  CZ: EU_112, SK: EU_112, HU: EU_112, RO: EU_112, BG: EU_112, HR: EU_112, SI: EU_112, LU: EU_112,
  EE: EU_112, LV: EU_112, LT: EU_112, TR: EU_112, KW: EU_112, NG: EU_112, GH: EU_112,
  RU: [
    { label: 'Emergency (all services)', phone: '112', type: 'other', primary: true },
    { label: 'Fire', phone: '101', type: 'fire' },
    { label: 'Police', phone: '102', type: 'police' },
    { label: 'Ambulance', phone: '103', type: 'medical' },
  ],
  UA: [
    { label: 'Emergency (all services)', phone: '112', type: 'other', primary: true },
    { label: 'Fire', phone: '101', type: 'fire' },
    { label: 'Police', phone: '102', type: 'police' },
    { label: 'Ambulance', phone: '103', type: 'medical' },
  ],
  IN: [
    { label: 'National emergency', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '100', type: 'police' },
    { label: 'Fire', phone: '101', type: 'fire' },
    { label: 'Ambulance', phone: '108', type: 'medical' },
    { label: 'Women helpline', phone: '1091', type: 'helpline' },
    { label: 'Child helpline', phone: '1098', type: 'helpline' },
    { label: 'Cyber crime helpline', phone: '1930', type: 'police' },
  ],
  PK: [
    { label: 'Police', phone: '15', type: 'police', primary: true },
    { label: 'Rescue & ambulance', phone: '1122', type: 'medical', primary: true },
    { label: 'Edhi ambulance', phone: '115', type: 'medical' },
  ],
  BD: [{ label: 'Emergency (all services)', phone: '999', type: 'other', primary: true }],
  NP: [
    { label: 'Police', phone: '100', type: 'police', primary: true },
    { label: 'Fire', phone: '101', type: 'fire' },
    { label: 'Ambulance', phone: '102', type: 'medical' },
  ],
  LK: [
    { label: 'Police', phone: '119', type: 'police', primary: true },
    { label: 'Ambulance (Suwa Seriya)', phone: '1990', type: 'medical', primary: true },
    { label: 'Fire', phone: '110', type: 'fire' },
  ],
  AE: [
    { label: 'Police', phone: '999', type: 'police', primary: true },
    { label: 'Ambulance', phone: '998', type: 'medical' },
    { label: 'Fire', phone: '997', type: 'fire' },
  ],
  SA: [
    { label: 'Unified emergency', phone: '911', type: 'other', primary: true },
    { label: 'Police', phone: '999', type: 'police' },
    { label: 'Ambulance', phone: '997', type: 'medical' },
    { label: 'Civil defense (fire)', phone: '998', type: 'fire' },
  ],
  QA: [{ label: 'Emergency (all services)', phone: '999', type: 'other', primary: true }],
  IL: [
    { label: 'Police', phone: '100', type: 'police', primary: true },
    { label: 'Ambulance (MDA)', phone: '101', type: 'medical', primary: true },
    { label: 'Fire', phone: '102', type: 'fire' },
  ],
  EG: [
    { label: 'Police', phone: '122', type: 'police', primary: true },
    { label: 'Ambulance', phone: '123', type: 'medical', primary: true },
    { label: 'Fire', phone: '180', type: 'fire' },
  ],
  ZA: [
    { label: 'Police', phone: '10111', type: 'police', primary: true },
    { label: 'Ambulance', phone: '10177', type: 'medical', primary: true },
    { label: 'Emergency from mobile', phone: '112', type: 'other' },
  ],
  KE: [
    { label: 'Emergency (all services)', phone: '999', type: 'other', primary: true },
    { label: 'Emergency (alternative)', phone: '112', type: 'other' },
  ],
  AU: [
    { label: 'Emergency (police, fire, ambulance)', phone: '000', type: 'other', primary: true },
    { label: 'Emergency from mobile', phone: '112', type: 'other' },
    { label: 'Police assistance (non-urgent)', phone: '131 444', type: 'police' },
    { label: 'Lifeline crisis support', phone: '13 11 14', type: 'helpline' },
  ],
  NZ: [
    { label: 'Emergency (police, fire, ambulance)', phone: '111', type: 'other', primary: true },
    { label: 'Police non-emergency', phone: '105', type: 'police' },
  ],
  JP: [
    { label: 'Police', phone: '110', type: 'police', primary: true },
    { label: 'Fire & ambulance', phone: '119', type: 'fire', primary: true },
  ],
  CN: [
    { label: 'Police', phone: '110', type: 'police', primary: true },
    { label: 'Fire', phone: '119', type: 'fire' },
    { label: 'Ambulance', phone: '120', type: 'medical', primary: true },
    { label: 'Traffic accidents', phone: '122', type: 'police' },
  ],
  KR: [
    { label: 'Police', phone: '112', type: 'police', primary: true },
    { label: 'Fire & ambulance', phone: '119', type: 'fire', primary: true },
  ],
  SG: [
    { label: 'Police', phone: '999', type: 'police', primary: true },
    { label: 'Fire & ambulance', phone: '995', type: 'medical', primary: true },
    { label: 'Non-emergency ambulance', phone: '1777', type: 'medical' },
  ],
  MY: [
    { label: 'Emergency (all services)', phone: '999', type: 'other', primary: true },
    { label: 'Emergency from mobile', phone: '112', type: 'other' },
  ],
  PH: [{ label: 'Emergency (all services)', phone: '911', type: 'other', primary: true }],
  ID: [
    { label: 'Emergency (all services)', phone: '112', type: 'other', primary: true },
    { label: 'Police', phone: '110', type: 'police' },
    { label: 'Fire', phone: '113', type: 'fire' },
    { label: 'Ambulance', phone: '119', type: 'medical' },
  ],
  TH: [
    { label: 'Police', phone: '191', type: 'police', primary: true },
    { label: 'Medical emergency', phone: '1669', type: 'medical', primary: true },
    { label: 'Fire', phone: '199', type: 'fire' },
    { label: 'Tourist police', phone: '1155', type: 'police' },
  ],
  VN: [
    { label: 'Police', phone: '113', type: 'police', primary: true },
    { label: 'Fire', phone: '114', type: 'fire' },
    { label: 'Ambulance', phone: '115', type: 'medical', primary: true },
  ],
  BR: [
    { label: 'Police', phone: '190', type: 'police', primary: true },
    { label: 'Ambulance (SAMU)', phone: '192', type: 'medical', primary: true },
    { label: 'Fire', phone: '193', type: 'fire' },
  ],
  AR: [
    { label: 'Emergency', phone: '911', type: 'other', primary: true },
    { label: 'Ambulance', phone: '107', type: 'medical' },
    { label: 'Fire', phone: '100', type: 'fire' },
    { label: 'Police', phone: '101', type: 'police' },
  ],
  CL: [
    { label: 'Ambulance', phone: '131', type: 'medical', primary: true },
    { label: 'Fire', phone: '132', type: 'fire' },
    { label: 'Police', phone: '133', type: 'police', primary: true },
  ],
  CO: [{ label: 'Emergency (all services)', phone: '123', type: 'other', primary: true }],
};

const FALLBACK: OfficialNumber[] = [
  { label: 'International mobile emergency', phone: '112', type: 'other', primary: true },
];

export function getOfficialNumbers(countryCode?: string): { numbers: OfficialNumber[]; isFallback: boolean } {
  const code = countryCode?.toUpperCase();
  if (code && NUMBERS[code]) return { numbers: NUMBERS[code], isFallback: false };
  return { numbers: FALLBACK, isFallback: true };
}
