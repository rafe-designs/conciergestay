export interface Listing {
  id: string;
  title: string;
  pricePerNight: number;
  location: string;
  address?: string;
  heroImage: string;
  videoUrl?: string;
  gallery?: string[];
  features?: string[];
  description?: string;
  type?: 'apartment' | 'villa' | 'mansion'| 'penthouse';
}

export const LISTINGS: Record<string, Listing> = {
  'new-horizon': {
    id: 'new-horizon',
    title: 'New Horizon Villa',
    pricePerNight: 450000,
    location: 'Ikate, Lagos',
    address: 'New Horizon 1 beside Nike Gallery, Ikate, Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/new-horizon-villa/hero.jpeg',
    videoUrl: '/assets/new-horizon-villa/walkthrough.mp4',
    gallery: [
      '/assets/new-horizon-villa/living-room.jpeg',
      '/assets/new-horizon-villa/bedroom.jpeg',
    ],
    features: [
      '2-Bedroom Luxury Suite',
      '24/7 Uninterrupted Power',
      'High-Speed Wi-Fi',
      'Smart TV & Netflix',
      'Sea View Balcony',
      'Swimming Pool ',
      'Elevator Access',
      'Private Jetty',
    ],
    description: 'An exquisite 2-bedroom luxury short-let residence situated in Ikate right beside the iconic Nike Art Gallery. Engineered for modern executive comfort, featuring high-speed fiber internet, premium entertainment, and elite security.',
  },
  'tuscany': {
    id: 'tuscany',
    title: 'Tuscany Villa',
    pricePerNight: 450000,
    location: 'Lekki Phase 1, Lagos',
    address: 'Admiralty Road, Lekki Phase 1, Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/tuscany/hero.jpg',
    videoUrl: '/assets/tuscany/walkthrough.mp4',
    gallery: [
      '/assets/tuscany/living-room.jpg',
      '/assets/tuscany/bedroom.jpg',
    ],
    features: [
      '2-Bedroom Luxury Suite',
      '24/7 Uninterrupted Power',
      'High-Speed Wi-Fi',
      'Smart TV',
      '24/7 Armed Security & Access Control',
      'Sea View Balcony',
      'Swimming Pool Access',
      'Elevator Access',
      'Private Jetty',
      'Outdoor Snooker',
      'Gym & Fitness Center',
      'Private Cinema Room',
    ],
    description: 'An ultra-exclusive 2-bedroom luxury short-let sanctuary situated at Admiralty Road, Lekki Phase 1, Lagos, Nigeria. Designed for elite executive living and leisure, this residence features breathtaking sea view balconies, elevator access, and a private jetty. Indulge in world-class resort amenities including a swimming pool, fully equipped gym, private cinema room, and outdoor snooker. Backed by 24/7 uninterrupted power, high-speed fiber Wi-Fi, smart entertainment, and rigorous armed security, it delivers the ultimate coastal lifestyle experience in Lagos.',
  },
  'loft-stay': {
    id: 'loft-stay',
    title: 'Loft Stay',
    pricePerNight: 450000,
    location: 'Lekki Phase 1, Lagos',
    address: 'Ezra court freedom way, Lekki phase one , Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/loft-stay/hero.jpg',
    videoUrl: '/assets/loft-stay/walkthrough.mp4',
    gallery: [
      '/assets/loft-stay/living-room.jpg',
      '/assets/loft-stay/bedroom.jpg',
    ],
    features: [
      '2-Bedroom Luxury Suite',
      '24/7 Uninterrupted Power',
      'Playstation 5',
      'High-Speed Wi-Fi',
      'Smart TV',
      'Ceiling Mirror',
      'Swimming Pool Access',
      'Outdoor Snooker',
      'Table Tennis',
      'Bdsm Kits',
      'Smart Home System (Alexa)',
    ],
    description: 'An immersive sanctuary of modern luxury and high-end entertainment, this sophisticated 2-bedroom suite is designed for unforgettable stays and absolute indulgence. Powered by a seamless Alexa smart home system, high-speed Wi-Fi, and 24/7 uninterrupted power, the residence effortlessly blends comfort with play. Enjoy high-octane gaming on the PlayStation 5, premium Smart TV viewing, or unwind with distinctive design features like a striking bedroom ceiling mirror and curated experiential amenities. Step outside to enjoy swimming pool access, competitive outdoor snooker, and table tennis. Whether for relaxation or an adventurous private getaway, this suite delivers an unmatched level of style and excitement.',
  },
  'cartier': {
    id: 'cartier',
    title: 'Cartier',
    pricePerNight: 350000,
    location: 'Lekki Phase 1, Lagos',
    address: 'LSDPC Estate, Lekki phase one , Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/cartier/hero.jpg',
    videoUrl: '/assets/cartier/walkthrough.mp4',
    gallery: [
      '/assets/cartier/living-room.jpg',
      '/assets/cartier/bedroom.jpg',
    ],
    features: [
      '1-Bedroom Luxury Suite',
      'Fully equipped kitchen', 
'House Keeping', 
'Super fast wifi',
'DSTV',
'24/7 Power',
'Premium Security ', 
'Netflix ', 
'Water Heating System ', 
'Car Park', 
'Clean sheets & towels ', 
'Balcony',
'Rooftop lounge & restaurant ',
'Kids play ground', 
'Football court', 
'Lawn tennis court', 
'Supermarket', 
'Smart door lock (self checkin)', 
'Water heater', 
'All room en-suite',
    ],
    description: 'An exceptional resort-style luxury residence that perfectly balances modern executive convenience with vibrant community amenities. Featuring all en-suite bedrooms, a fully equipped kitchen, and advanced smart door lock technology for effortless self check-in, this home guarantees total privacy and ease from the moment you arrive. Unwind on your private balcony or enjoy premium entertainment with super-fast Wi-Fi, Netflix, and DSTV. Step outside into an exclusive, highly secure estate complete with a rooftop lounge and restaurant, an on-site supermarket, football and lawn tennis courts, a kids playground, and ample car parking. Backed by 24/7 uninterrupted power, rigorous premium security, professional housekeeping, and luxury linen services, every detail is meticulously crafted for an elite and carefree Lagos stay.',
  },
  'irene': {
    id: 'irene',
    title: 'Irene',
    pricePerNight: 650000,
    location: 'Ikate, Lagos',
    address: 'Ikate, Lekki by Chisco, Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/irene/hero.jpg',
    videoUrl: '/assets/irene/walkthrough.mp4',
    gallery: [
      '/assets/irene/living-room.jpg',
      '/assets/irene/bedroom.jpg',
    ],
    features: [
      '4-Bedroom Luxury Suite', 
      'Super fast wifi',
      '24/7 Power',
      'Premium Security ', 
      'Smart TV & Netflix ', 
      'Indoor Snooker Table', 
      'Smart door lock (self checkin)', 
      'Indoor Cinema', 
    ],
    description: 'Situated in a prime, highly accessible location in Ikate just off Chisco, Irene Apartment is a magnificent 3-bedroom luxury short-let suite designed for ultimate comfort, recreation, and effortless executive living. Featuring smart door lock technology for seamless self check-in, the residence offers expansive living spaces backed by 24/7 uninterrupted power, premium security, and lightning-fast Wi-Fi. Entertainment and fun abound with Netflix, DSTV, an in-house air hockey table, and an estate table tennis court. Enjoy the convenience of a fully equipped kitchen, water heating systems, professional housekeeping, dedicated car parking, and an on-site supermarket for all your daily needs. Whether traveling with family or colleagues, Irene Apartment provides an elite sanctuary of style and leisure in the heart of Lekki.',
  },
  'symphony': {
    id: 'symphony',
    title: 'Symphony',
    pricePerNight: 600000,
    location: 'Ikoyi, Lagos',
    address: 'Ikoyi, Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/symphony/hero.jpg',
    videoUrl: '/assets/symphony/walkthrough.mp4',
    gallery: [
      '/assets/symphony/living-room.jpg',
      '/assets/symphony/bedroom.jpg',
    ],
    features: [
      '3-Bedroom Luxury Suite', 
      'Super fast wifi',
      '24/7 Power',
      'Premium Security ', 
      'Netflix ', 
      'Table tennis court', 
      'Smart door lock (self checkin)', 
      'Air Hockey Table', 
    ],
    description: 'Situated in a prime, highly accessible location in Ikate just off Chisco, Irene Apartment is a magnificent 3-bedroom luxury short-let suite designed for ultimate comfort, recreation, and effortless executive living. Featuring smart door lock technology for seamless self check-in, the residence offers expansive living spaces backed by 24/7 uninterrupted power, premium security, and lightning-fast Wi-Fi. Entertainment and fun abound with Netflix, DSTV, an in-house air hockey table, and an estate table tennis court. Enjoy the convenience of a fully equipped kitchen, water heating systems, professional housekeeping, dedicated car parking, and an on-site supermarket for all your daily needs. Whether traveling with family or colleagues, Irene Apartment provides an elite sanctuary of style and leisure in the heart of Lekki.',
  },
  'elysium': {
    id: 'elysium',
    title: 'Elysium',
    pricePerNight: 600000,
    location: 'Ikoyi, Lagos',
    address: 'Ikoyi, Lagos, Nigeria',
    type: 'apartment',
    heroImage: '/assets/elysium/hero.jpg',
    videoUrl: '/assets/elysium/walkthrough.mp4',
    gallery: [
      '/assets/elysium/living-room.jpg',
      '/assets/elysium/bedroom.jpg',
    ],
    features: [
      '3-Bedroom Luxury Suite', 
      'Super fast wifi',
      '24/7 Power',
      'Premium Security ', 
      'Netflix ', 
      'Table tennis court', 
      'Smart door lock (self checkin)', 
      'Air Hockey Table', 
    ],
    description: 'Situated in a prime, highly accessible location in Ikate just off Chisco, Irene Apartment is a magnificent 3-bedroom luxury short-let suite designed for ultimate comfort, recreation, and effortless executive living. Featuring smart door lock technology for seamless self check-in, the residence offers expansive living spaces backed by 24/7 uninterrupted power, premium security, and lightning-fast Wi-Fi. Entertainment and fun abound with Netflix, DSTV, an in-house air hockey table, and an estate table tennis court. Enjoy the convenience of a fully equipped kitchen, water heating systems, professional housekeeping, dedicated car parking, and an on-site supermarket for all your daily needs. Whether traveling with family or colleagues, Irene Apartment provides an elite sanctuary of style and leisure in the heart of Lekki.',
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