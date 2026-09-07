export interface Listing {
  id: string;
  title: string;
  pricePerNight: number;
  location: string;
  heroImage: string;
  gallery?: string[];
  features?: string[];
  description?: string;
  type?: 'penthouse' | 'villa' | 'mansion';
}

export const LISTINGS: Record<string, Listing> = {
  'ikoyi-royal-villa': {
    id: 'ikoyi-royal-villa',
    title: 'The Ikoyi Royal Waterfront Mansion',
    pricePerNight: 250000,
    location: 'Ikoyi, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
    ],
    features: ['Waterfront View', 'Private Swimming Pool', '24/7 Power', 'Chef Service'],
    description: 'Bespoke waterfront mansion featuring panoramic view of the lagoon and luxury finishes.',
  },
  'banana-island-penthouse': {
    id: 'banana-island-penthouse',
    title: 'Banana Island Grand Penthouse',
    pricePerNight: 350000,
    location: 'Banana Island, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    features: ['Panoramic City Skyline', 'Private Elevator', 'Smart Home Automation'],
    description: 'Ultra-exclusive high-rise luxury penthouse with private security and rooftop lounge.',
  },
  'victoria-island-villa': {
    id: 'victoria-island-villa',
    title: 'Victoria Island Oceanfront Villa',
    pricePerNight: 280000,
    location: 'Victoria Island, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    features: ['Ocean View', 'Infinity Pool', 'Private Cinema'],
    description: 'Modern beach-style architectural masterpiece located in the heart of VI.',
  },
  'lekki-phase1-mansion': {
    id: 'lekki-phase1-mansion',
    title: 'Lekki Phase 1 Presidential Suite',
    pricePerNight: 200000,
    location: 'Lekki Phase 1, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    features: ['Jacuzzi Bath', 'High-Speed Fiber Wifi', 'Dedicated Butler'],
    description: 'Sleek luxury home designed for elite business travellers and executive retreats.',
  },
  'eko-atlantic-penthouse': {
    id: 'eko-atlantic-penthouse',
    title: 'Eko Atlantic Skyline Penthouse',
    pricePerNight: 400000,
    location: 'Eko Atlantic, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    features: ['Atlantic Ocean View', 'Helipad Access', '24/7 Security Concierge'],
    description: 'World-class residence soaring over Eko Atlantic city offering unparalleled luxury.',
  },
  'chevron-deluxe-villa': {
    id: 'chevron-deluxe-villa',
    title: 'Chevron Luxe Family Villa',
    pricePerNight: 150000,
    location: 'Lekki, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    features: ['Private Garden', 'Fully Fitted Kitchen', 'In-house Gym'],
    description: 'Spacious multi-bedroom villa ideal for stays requiring absolute privacy and peace.',
  },
  'ikoyi-lagoon-penthouse': {
    id: 'ikoyi-lagoon-penthouse',
    title: 'Ikoyi Crest Lagoon Penthouse',
    pricePerNight: 320000,
    location: 'Ikoyi, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    features: ['Lagoon Breeze Deck', 'Private Cocktail Bar', 'Floor-to-Ceiling Windows'],
    description: 'Top-tier luxury penthouse with sweeping views over five cowries creek.',
  },
  'banana-island-mansion': {
    id: 'banana-island-mansion',
    title: 'The Pearl Mansion Banana Island',
    pricePerNight: 500000,
    location: 'Banana Island, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    features: ['Private Dock', ' heated Underground Pool', 'Armored Car Service'],
    description: 'The ultimate benchmark in high-end living for dignitaries and royalty.',
  },
  'ikeja-gra-villa': {
    id: 'ikeja-gra-villa',
    title: 'Ikeja GRA Executive Haven',
    pricePerNight: 180000,
    location: 'Ikeja GRA, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    features: ['Proximity to Airport', 'Private Security', 'Serene Neighborhood'],
    description: 'Tranquil mainland sanctuary structured with contemporary executive elegance.',
  },
  'oniru-sea-view-penthouse': {
    id: 'oniru-sea-view-penthouse',
    title: 'Oniru Heights Sea View Penthouse',
    pricePerNight: 230000,
    location: 'Oniru, Victoria Island',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    features: ['Sea View Balcony', 'Smart Entertainment Hub', 'Housekeeping'],
    description: 'Positioned right at the VI perimeter with fast access to prime financial hubs.',
  },
  'periwinkle-estate-villa': {
    id: 'periwinkle-estate-villa',
    title: 'Periwinkle Water View Villa',
    pricePerNight: 290000,
    location: 'Lekki Phase 1, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    features: ['Gated Security Community', 'Water View', 'Bespoke Interior Design'],
    description: 'A grand luxury escape built inside one of Lekki’s most secure enclaves.',
  },
  'victoria-island-mansion': {
    id: 'victoria-island-mansion',
    title: 'Ahmadu Bello Diplomatic Mansion',
    pricePerNight: 380000,
    location: 'Victoria Island, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    features: ['Diplomatic Grade Protection', 'Banquet Dining Hall', 'Private Sauna'],
    description: 'Crafted for corporate board meetings, hosting VIP guests, and high-profile retreats.',
  },
  'banana-island-sunset-penthouse': {
    id: 'banana-island-sunset-penthouse',
    title: 'Sunset Cove Penthouse',
    pricePerNight: 310000,
    location: 'Banana Island, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80',
    features: ['Sunset Observation Deck', 'Infinity Jacuzzi', 'Private Chef'],
    description: 'Enjoy magnificent gold-tinted sunsets over the Lagos coastline every evening.',
  },
  'ikoyi-bourdillon-villa': {
    id: 'ikoyi-bourdillon-villa',
    title: 'Bourdillon Signature Residence',
    pricePerNight: 270000,
    location: 'Ikoyi, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
    features: ['Prime Location', 'Art Gallery Corridors', 'Chauffeur On Request'],
    description: 'Exquisite architecture situated on West Africa’s most famous avenue.',
  },
  'lekki-county-mansion': {
    id: 'lekki-county-mansion',
    title: 'The Sovereign Estate Villa',
    pricePerNight: 210000,
    location: 'Lekki, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
    features: ['Ultra-wide Living Spaces', 'Games Room', 'Private Courtyard'],
    description: 'Modern luxury retreat featuring high ceilings and sunlit open layout concepts.',
  },
  'eko-atlantic-marina-penthouse': {
    id: 'eko-atlantic-marina-penthouse',
    title: 'Eko Marina Vista Penthouse',
    pricePerNight: 420000,
    location: 'Eko Atlantic, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    features: ['Yacht Docking Access', 'Wine Cellar', 'Automated Lighting'],
    description: 'Unmatched luxury penthouse with direct views of the inner marina basin.',
  },
  'osapa-london-villa': {
    id: 'osapa-london-villa',
    title: 'Osapa London Luxury Villa',
    pricePerNight: 160000,
    location: 'Lekki, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
    features: ['Private Cinema', 'Sound System', 'Poolside Lounge'],
    description: 'Urban luxury sanctuary packed with state-of-the-art entertainment units.',
  },
  'ikoyi-alexander-mansion': {
    id: 'ikoyi-alexander-mansion',
    title: 'Alexander Manor Ikoyi',
    pricePerNight: 390000,
    location: 'Ikoyi, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80',
    features: ['Lush Private Gardens', 'Tennis Court', 'High-Security Perimeter'],
    description: 'Heritage mansion estate surrounded by manicured botanical gardens.',
  },
  'nicon-town-villa': {
    id: 'nicon-town-villa',
    title: 'Nicon Town Palace Villa',
    pricePerNight: 330000,
    location: 'Lekki Phase 1, Lagos',
    type: 'villa',
    heroImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80',
    features: ['24/7 Patrol Security', 'Private Gym', 'Infinity Pool'],
    description: 'Situated in one of the safest gated communities in coastal West Africa.',
  },
  'parkview-estate-mansion': {
    id: 'parkview-estate-mansion',
    title: 'Parkview Estate Luxury Villa',
    pricePerNight: 260000,
    location: 'Ikoyi, Lagos',
    type: 'mansion',
    heroImage: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    features: ['Water Purification Plant', 'In-house Spa', 'Smart Access Control'],
    description: 'Quiet, secluded luxury residence engineered for maximum relaxation and security.',
  },
  'banana-island-marina-penthouse': {
    id: 'banana-island-marina-penthouse',
    title: 'Banana Island Marina Sky Villa',
    pricePerNight: 480000,
    location: 'Banana Island, Lagos',
    type: 'penthouse',
    heroImage: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
    features: ['360 Waterfront Deck', 'Personal Concierge', 'Express Helipad Transfer'],
    description: 'The crowning luxury unit of Banana Island, built with fine marble and floor-to-ceiling glass.',
  },
};

export interface MealItem {
  id: string;
  name: string;
  basePrice: number;
}

export interface SoupItem {
  id: string;
  name: string;
  pricePerLiter: number;
}

export interface ProteinItem {
  id: string;
  name: string;
  price: number;
}

export const SWALLOW_OPTIONS = ['Amala', 'Eba', 'Fufu', 'wheat', 'poundo', 'semo'];

export const PROTEIN_OPTIONS: ProteinItem[] = [
  { id: 'pr_beef', name: 'Beef', price: 6000 },
  { id: 'pr_goat', name: 'Goat Meat', price: 8000 },
  { id: 'pr_chicken', name: 'Chicken', price: 10000 },
  { id: 'pr_turkey', name: 'Turkey', price: 12000 },
  { id: 'pr_assorted', name: 'Assorted Meat', price: 9000 },
  { id: 'pr_fresh_fish', name: 'Fresh Fish', price: 14000 },
  { id: 'pr_catfish', name: 'Catfish', price: 16000 },
  { id: 'pr_croaker', name: 'Croaker Fish', price: 16000 },
  { id: 'pr_stockfish', name: 'Stockfish', price: 12000 },
  { id: 'pr_snail', name: 'Snail', price: 16000 },
  { id: 'pr_cow_leg', name: 'Cow Leg', price: 8000 },
  { id: 'pr_cow_tail', name: 'Cow Tail', price: 10000 },
  { id: 'pr_shaki', name: 'Shaki (Tripe)', price: 7000 },
];

export const SOUP_OPTIONS: SoupItem[] = [
  { id: 'sp_egusi', name: 'Egusi Soup', pricePerLiter: 40000 },
  { id: 'sp_ogbono', name: 'Ogbono Soup', pricePerLiter: 40000 },
  { id: 'sp_edikang', name: 'Edikang Ikong Soup', pricePerLiter: 44000 },
  { id: 'sp_afang', name: 'Afang Soup', pricePerLiter: 42000 },
  { id: 'sp_oha', name: 'Oha Soup', pricePerLiter: 42000 },
  { id: 'sp_bitterleaf', name: 'Bitterleaf Soup', pricePerLiter: 42000 },
  { id: 'sp_ewedu_gbegiri', name: 'Ewedu & Gbegiri', pricePerLiter: 36000 },
  { id: 'sp_abula', name: 'Abula', pricePerLiter: 38000 },
  { id: 'sp_okra', name: 'Okra Soup', pricePerLiter: 40000 },
  { id: 'sp_banga', name: 'Banga Soup', pricePerLiter: 44000 },
  { id: 'sp_nsala', name: 'Ofe Nsala (White Soup)', pricePerLiter: 46000 },
  { id: 'sp_veg', name: 'Vegetable Soup', pricePerLiter: 40000 },
  { id: 'sp_fisherman', name: 'Fisherman Soup', pricePerLiter: 56000 },
  { id: 'sp_owerri', name: 'Ofe Owerri', pricePerLiter: 46000 },
  { id: 'sp_efo_riro', name: 'Efo Riro', pricePerLiter: 40000 },
  { id: 'sp_afia_efere', name: 'Afia Efere (White Soup)', pricePerLiter: 46000 },
  { id: 'sp_editan', name: 'Editan Soup', pricePerLiter: 44000 },
  { id: 'sp_atama', name: 'Atama Soup', pricePerLiter: 44000 },
  { id: 'sp_owho', name: 'Owho Soup', pricePerLiter: 42000 },
];

export const SPICED_COMFORT_OPTIONS: SoupItem[] = [
  { id: 'sp_ukodo', name: 'Ukodo (Yam Pepper Soup)', pricePerLiter: 46000 },
  { id: 'sp_abacha', name: 'Abacha (African Salad)', pricePerLiter: 14000 },
  { id: 'sp_nkwobi', name: 'Nkwobi', pricePerLiter: 24000 },
  { id: 'sp_isi_ewu', name: 'Isi Ewu', pricePerLiter: 30000 },
  { id: 'sp_ekpang', name: 'Ekpang Nkukwo', pricePerLiter: 20000 },
  { id: 'sp_bole_fish', name: 'Bole & Fish', pricePerLiter: 19000 },
  { id: 'sp_barbecue', name: 'Barbecue', pricePerLiter: 30000 },
];

export const CULINARY_MEALS: Record<string, MealItem[]> = {
  rice: [
    { id: 'rc_jollof', name: 'Jollof Rice & Chicken', basePrice: 50000 },
    { id: 'rc_white_stew', name: 'White Rice & Stew', basePrice: 40000 },
    { id: 'rc_white_ofada', name: 'White Rice & Ofada Sauce', basePrice: 44000 },
    { id: 'rc_ofada_ayamase', name: 'Ofada Rice & Ayamase', basePrice: 50000 },
    { id: 'rc_coconut', name: 'Coconut Rice', basePrice: 44000 },
    { id: 'rc_native', name: 'Native Jollof Rice', basePrice: 48000 },
    { id: 'rc_fried', name: 'Fried Rice & Chicken', basePrice: 50000 },
    { id: 'rc_special_village', name: 'Special Village Rice', basePrice: 50000 },
    { id: 'rc_dirty', name: 'Dirty Rice', basePrice: 40000 },
    { id: 'rc_seafood', name: 'Seafood Rice', basePrice: 60000 },
    { id: 'rc_platters', name: 'Mixed Platters', basePrice: 70000 },
  ],
  breakfast: [
    { id: 'bf_asaro', name: 'Yam Porridge (Asaro)', basePrice: 40000 },
    { id: 'bf_asaro_fish', name: 'Yam Porridge with Fish', basePrice: 50000 },
    { id: 'bf_fried_yam', name: 'Fried Yam & Pepper Sauce', basePrice: 40000 },
    { id: 'bf_boiled_yam', name: 'Boiled Yam & Garden Egg Sauce', basePrice: 42000 },
    { id: 'bf_plantain_porridge', name: 'Plantain Porridge', basePrice: 40000 },
    { id: 'bf_fried_plantain', name: 'Fried Plantain & Fish Sauce', basePrice: 50000 },
    { id: 'bf_boiled_plantain', name: 'Boiled Plantain & Vegetable Sauce', basePrice: 44000 },
  ],
  dinner: [
    { id: 'dn_beans_porridge', name: 'Beans Porridge', basePrice: 40000 },
    { id: 'dn_beans_plantain', name: 'Beans & Plantain', basePrice: 44000 },
    { id: 'dn_beans_yam', name: 'Beans & Yam', basePrice: 44000 },
    { id: 'dn_ewa_agoyin', name: 'Ewa Agoyin with Special Sauce', basePrice: 46000 },
    { id: 'dn_moimoi_stew', name: 'Moi Moi & Stew', basePrice: 40000 },
  ],
};