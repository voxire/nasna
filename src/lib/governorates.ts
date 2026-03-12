export const LEBANON_GOVERNORATES = [
  'Beirut',
  'Mount Lebanon',
  'North Lebanon',
  'Akkar',
  'Beqaa',
  'Baalbek-Hermel',
  'South Lebanon',
  'Nabatieh',
] as const;

export type LebanonGovernorate = (typeof LEBANON_GOVERNORATES)[number];

export const LEBANON_GOVERNORATE_TRANSLATION_KEYS: Record<LebanonGovernorate, string> = {
  Beirut: 'home.governorate1',
  'Mount Lebanon': 'home.governorate2',
  'North Lebanon': 'home.governorate4',
  Akkar: 'home.governorate5',
  Beqaa: 'home.governorate7',
  'Baalbek-Hermel': 'home.governorate11',
  'South Lebanon': 'home.governorate12',
  Nabatieh: 'home.governorate10',
};
