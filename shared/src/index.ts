export const GOVERNORATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  'Mount Lebanon': { lat: 33.8101, lng: 35.5972 },
  Baabdat: { lat: 33.8707, lng: 35.6614 },
  'North Lebanon': { lat: 34.4367, lng: 35.8497 },
  Akkar: { lat: 34.5329, lng: 36.1728 },
  Baalbek: { lat: 34.0058, lng: 36.2181 },
  Beqaa: { lat: 33.8464, lng: 35.9028 },
  Tyre: { lat: 33.2704, lng: 35.2038 },
  Saida: { lat: 33.5606, lng: 35.3756 },
  Nabatiyeh: { lat: 33.3789, lng: 35.4834 },
};

export function getCoordinates(governorate?: string): { lat: number; lng: number } {
  return GOVERNORATE_COORDINATES[governorate ?? ''] ?? { lat: 33.8547, lng: 35.8623 };
}
