export interface ServiceOption {
  id: string;
  name: string;
  category: 'CATERING' | 'LAUNDRY' | 'CLEANING' | 'SHOPPER';
  description: string;
  price: number;
  unit: string;
  iconName: string;
}

export interface ApartmentListing {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviewsCount: number;
  pricePerNight: number;
  images: string[];
  description: string;
  maxGuests: number;
  bedrooms: number;
  baths: number;
}