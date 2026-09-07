export interface ConciergeOption {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  capacity?: string;
}

export const AIRPORT_CAR_OPTIONS: ConciergeOption[] = [
  {
    id: 'airport-sedan',
    name: 'Executive Sedan',
    price: 35000,
    capacity: '1-3 Guests',
    image: '/concierge/airport/prado-standard.jpg',
    description: 'Comfortable luxury sedan for swift airport transfers.',
  },
  {
    id: 'airport-suv',
    name: 'Luxury SUV',
    price: 60000,
    capacity: '1-5 Guests',
    image: '/concierge/airport/Mercedez-Benz-s550-600x338.jpg',
    description: 'Spacious SUV with ample luggage room and high ground clearance.',
  },
  {
    id: 'airport-van',
    name: 'Executive Minivan',
    price: 90000,
    capacity: '1-8 Guests',
    image: '/concierge/airport/Toyota-Land-Cruiser-LC300-2.jpg',
    description: 'Ideal for group arrivals with large luggage capacity.',
  },
];

export const CHAUFFEUR_OPTIONS: ConciergeOption[] = [
  {
    id: 'chauffeur-sedan',
    name: 'Full-Day Executive Sedan',
    price: 75000,
    image: '/concierge/chauffeur/executive-sedan.jpg',
    description: '12-hour dedicated driver with fuel included within city limits.',
  },
  {
    id: 'chauffeur-suv',
    name: 'Full-Day Luxury SUV',
    price: 120000,
    image: '/concierge/chauffeur/luxury-suv.jpg',
    description: 'Premium SUV with a professional chauffeur at your disposal.',
  },
];

export const SECURITY_OPTIONS: ConciergeOption[] = [
  {
    id: 'sec-standard',
    name: 'Standard Uniformed Guard',
    price: 45000,
    image: '/concierge/security/standard-guard.jpg',
    description: 'Static property & access control personnel.',
  },
  {
    id: 'sec-escort',
    name: 'Armed Mobile Escort',
    price: 100000,
    image: '/concierge/security/armed-escort.jpg',
    description: 'Tactical escort team for safe transit.',
  },
  {
    id: 'sec-close-protection',
    name: 'Executive Close Protection (CPO)',
    price: 150000,
    image: '/concierge/security/close-protection.jpg',
    description: 'Discrete personal bodyguard protection.',
  },
];