'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Car, 
  ShieldCheck, 
  Plane, 
  Sparkles, 
  Bed, 
  Shirt, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Utensils,
  ChefHat,
  Truck,
  Calendar
} from 'lucide-react';

// --- FOOD MENU DATA CONSTANTS ---
export const CHEF_MENU = [
  // Soups (Per Litre)
  { id: 'soup_egusi', name: 'Egusi Soup', category: 'soup', price: 40000 },
  { id: 'soup_ogbono', name: 'Ogbono Soup', category: 'soup', price: 40000 },
  { id: 'soup_edikang', name: 'Edikang Ikong Soup', category: 'soup', price: 44000 },
  { id: 'soup_afang', name: 'Afang Soup', category: 'soup', price: 42000 },
  { id: 'soup_oha', name: 'Oha Soup', category: 'soup', price: 42000 },
  { id: 'soup_bitterleaf', name: 'Bitterleaf Soup', category: 'soup', price: 42000 },
  { id: 'soup_ewedu_gbegiri', name: 'Ewedu & Gbegiri', category: 'soup', price: 36000 },
  { id: 'soup_abula', name: 'Abula', category: 'soup', price: 38000 },
  { id: 'soup_okra', name: 'Okra Soup', category: 'soup', price: 40000 },
  { id: 'soup_banga', name: 'Banga Soup', category: 'soup', price: 44000 },
  { id: 'soup_nsala', name: 'Ofe Nsala (White Soup)', category: 'soup', price: 46000 },
  { id: 'soup_vegetable', name: 'Vegetable Soup', category: 'soup', price: 40000 },
  { id: 'soup_fisherman', name: 'Fisherman Soup', category: 'soup', price: 56000 },
  { id: 'soup_owerri', name: 'Ofe Owerri', category: 'soup', price: 46000 },
  { id: 'soup_efo_riro', name: 'Efo Riro', category: 'soup', price: 40000 },
  { id: 'soup_afia_efere', name: 'Afia Efere (White Soup)', category: 'soup', price: 46000 },
  { id: 'soup_editan', name: 'Editan Soup', category: 'soup', price: 44000 },
  { id: 'soup_atama', name: 'Atama Soup', category: 'soup', price: 44000 },
  { id: 'soup_owho', name: 'Owho Soup', category: 'soup', price: 42000 },
  { id: 'soup_ukodo', name: 'Ukodo (Yam Pepper Soup)', category: 'soup', price: 46000 },

  // Lunch Specials
  { id: 'lunch_abacha', name: 'Abacha (African Salad)', category: 'lunch', price: 14000 },
  { id: 'lunch_nkwobi', name: 'Nkwobi', category: 'lunch', price: 24000 },
  { id: 'lunch_isi_ewu', name: 'Isi Ewu', category: 'lunch', price: 30000 },
  { id: 'lunch_ekpang', name: 'Ekpang Nkukwo', category: 'lunch', price: 20000 },
  { id: 'lunch_bole_fish', name: 'Bole & Fish', category: 'lunch', price: 19000 },

  // Rice Specialities (Per Litre)
  { id: 'rice_jollof_chicken', name: 'Jollof Rice & Chicken', category: 'rice', price: 50000 },
  { id: 'rice_white_stew', name: 'White Rice & Stew', category: 'rice', price: 40000 },
  { id: 'rice_white_ofada', name: 'White Rice & Ofada Sauce', category: 'rice', price: 44000 },
  { id: 'rice_ofada_ayamase', name: 'Ofada Rice & Ayamase', category: 'rice', price: 50000 },
  { id: 'rice_coconut', name: 'Coconut Rice', category: 'rice', price: 44000 },
  { id: 'rice_native_jollof', name: 'Native Jollof Rice', category: 'rice', price: 48000 },
  { id: 'rice_fried_chicken', name: 'Fried Rice & Chicken', category: 'rice', price: 50000 },

  // Chef Specials (Per Litre)
  { id: 'chef_village_rice', name: 'Special Village Rice', category: 'chef_special', price: 50000 },
  { id: 'chef_dirty_rice', name: 'Dirty Rice', category: 'chef_special', price: 40000 },
  { id: 'chef_seafood_rice', name: 'Seafood Rice', category: 'chef_special', price: 60000 },
  { id: 'chef_mixed_platters', name: 'Mixed Platters', category: 'chef_special', price: 70000 },

  // Breakfast
  { id: 'bf_asaro', name: 'Yam Porridge (Asaro)', category: 'breakfast', price: 40000 },
  { id: 'bf_asaro_fish', name: 'Yam Porridge with Fish', category: 'breakfast', price: 50000 },
  { id: 'bf_fried_yam_sauce', name: 'Fried Yam & Pepper Sauce', category: 'breakfast', price: 40000 },
  { id: 'bf_boiled_yam_egg', name: 'Boiled Yam & Garden Egg Sauce', category: 'breakfast', price: 42000 },
  { id: 'bf_plantain_porridge', name: 'Plantain Porridge', category: 'breakfast', price: 40000 },
  { id: 'bf_fried_plantain_fish', name: 'Fried Plantain & Fish Sauce', category: 'breakfast', price: 50000 },
  { id: 'bf_boiled_plantain_veg', name: 'Boiled Plantain & Vegetable Sauce', category: 'breakfast', price: 44000 },

  // Dinner
  { id: 'dn_beans_porridge', name: 'Beans Porridge', category: 'dinner', price: 40000 },
  { id: 'dn_beans_plantain', name: 'Beans & Plantain', category: 'dinner', price: 44000 },
  { id: 'dn_beans_yam', name: 'Beans & Yam', category: 'dinner', price: 44000 },
  { id: 'dn_ewa_agoyin', name: 'Ewa Agoyin with Special Sauce', category: 'dinner', price: 46000 },
  { id: 'dn_moi_moi_stew', name: 'Moi Moi & Stew', category: 'dinner', price: 40000 },
];

// Exported explicitly so external files (like checkout) can import it without editor errors
export const PROTEIN_OPTIONS = [
  { id: 'p_beef', name: 'Beef', price: 6000 },
  { id: 'p_goat', name: 'Goat Meat', price: 8000 },
  { id: 'p_chicken', name: 'Chicken', price: 10000 },
  { id: 'p_turkey', name: 'Turkey', price: 12000 },
  { id: 'p_assorted', name: 'Assorted Meat', price: 9000 },
  { id: 'p_fresh_fish', name: 'Fresh Fish', price: 14000 },
  { id: 'p_catfish', name: 'Catfish', price: 16000 },
  { id: 'p_croaker', name: 'Croaker Fish', price: 16000 },
  { id: 'p_stockfish', name: 'Stockfish', price: 12000 },
  { id: 'p_snail', name: 'Snail', price: 16000 },
  { id: 'p_cow_leg', name: 'Cow Leg', price: 8000 },
  { id: 'p_cow_tail', name: 'Cow Tail', price: 10000 },
  { id: 'p_shaki', name: 'Shaki (Tripe)', price: 7000 },
];

export const SWALLOW_OPTIONS = [
  'Fufu',
  'Eba',
  'Amala',
  'Semo',
  'Poundo',
  'Wheat'
];

export const MENU_CATEGORIES = [
  { id: 'soup', label: 'Soups' },
  { id: 'lunch', label: 'Lunch Specials' },
  { id: 'rice', label: 'Rice Specialties' },
  { id: 'chef_special', label: '⭐ Chef Specials' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'dinner', label: 'Dinner' }
];

interface Props {
  nights?: number;
  guests?: number;
  onChange?: (data: {
    addons: Record<string, any>;
    dailyMealSelections: Record<number, any>;
    totalConciergePrice: number;
    totalMealPrice: number;
    grandTotal: number;
  }) => void;
}

export default function ConciergeBooking({ nights = 1, onChange }: Props) {
  // --- ADD-ON SELECTION STATES ---
  const [chauffeurActive, setChchauffeurActive] = useState(false);
  const [chauffeurVehicle, setChauffeurVehicle] = useState<'sedan' | 'suv' | 'luxury'>('sedan');

  const [securityActive, setSecurityActive] = useState(false);
  const [securityType, setSecurityType] = useState<'standard' | 'armed' | 'escort'>('standard');
  const [securityPersonnelCount, setSecurityPersonnelCount] = useState(1);

  const [airportActive, setAirportActive] = useState(false);
  const [airportTripType, setAirportTripType] = useState<'pickup' | 'dropoff' | 'roundtrip'>('roundtrip');

  const [housekeepingActive, setHousekeepingActive] = useState(false);
  const [housekeepingFrequency, setHousekeepingFrequency] = useState<'daily' | 'every_two_days'>('daily');

  const [laundryActive, setLaundryActive] = useState(false);
  const [laundryAdultCount, setLaundryAdultCount] = useState(0);
  const [laundryKidsCount, setLaundryKidsCount] = useState(0);
  const [laundrySuitsCount, setLaundrySuitsCount] = useState(0);

  const [beddingsActive, setBeddingsActive] = useState(false);
  const [duvetCount, setDuvetCount] = useState(0);
  const [towelCount, setTowelCount] = useState(0);

  const [shopperActive, setShopperActive] = useState(false);
  const [shopperCount, setShopperCount] = useState(1);

  // --- MEAL & CHEF STATES ---
  const [mealsActive, setMealsActive] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState(1);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('soup');
  
  // Track open dropdown accordions per meal ID
  const [openMealDropdowns, setOpenMealDropdowns] = useState<Record<string, boolean>>({});

  const [dailyMealSelections, setDailyMealSelections] = useState<Record<number, {
    preparationType: 'chef' | 'delivery';
    items: Record<string, { qty: number; swallow?: string; proteins: Record<string, number> }>;
  }>>({});

  useEffect(() => {
    if (nights <= 2) {
      setHousekeepingFrequency('daily');
    }
  }, [nights]);

  const handleMealItemChange = (day: number, itemId: string, delta: number) => {
    setDailyMealSelections(prev => {
      const currentDay = prev[day] || { preparationType: 'chef', items: {} };
      const currentItem = currentDay.items[itemId] || { qty: 0, swallow: 'Eba', proteins: {} };
      const nextQty = Math.max(0, currentItem.qty + delta);

      const updatedItems = { ...currentDay.items };
      if (nextQty > 0) {
        updatedItems[itemId] = {
          ...currentItem,
          qty: nextQty,
          swallow: currentItem.swallow || 'Eba'
        };
      } else {
        delete updatedItems[itemId];
      }

      return {
        ...prev,
        [day]: { 
          ...currentDay, 
          items: updatedItems
        }
      };
    });

    if (delta > 0) {
      setOpenMealDropdowns(prev => ({ ...prev, [itemId]: true }));
    }
  };

  const handleSwallowChange = (day: number, itemId: string, swallow: string) => {
    setDailyMealSelections(prev => {
      const currentDay = prev[day] || { preparationType: 'chef', items: {} };
      const currentItem = currentDay.items[itemId];

      if (!currentItem || currentItem.qty <= 0) return prev;

      return {
        ...prev,
        [day]: {
          ...currentDay,
          items: {
            ...currentDay.items,
            [itemId]: {
              ...currentItem,
              swallow
            }
          }
        }
      };
    });
  };

  const handleProteinChange = (day: number, itemId: string, proteinId: string, delta: number) => {
    setDailyMealSelections(prev => {
      const currentDay = prev[day] || { preparationType: 'chef', items: {} };
      const currentItem = currentDay.items[itemId];

      if (!currentItem || currentItem.qty <= 0) return prev;

      const currentProteinQty = currentItem.proteins[proteinId] || 0;
      const nextProteinQty = Math.max(0, currentProteinQty + delta);

      const updatedProteins = { ...currentItem.proteins };
      if (nextProteinQty > 0) {
        updatedProteins[proteinId] = nextProteinQty;
      } else {
        delete updatedProteins[proteinId];
      }

      return {
        ...prev,
        [day]: {
          ...currentDay,
          items: {
            ...currentDay.items,
            [itemId]: {
              ...currentItem,
              proteins: updatedProteins
            }
          }
        }
      };
    });
  };

  const toggleDropdown = (itemId: string) => {
    setOpenMealDropdowns(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handlePrepTypeChange = (day: number, type: 'chef' | 'delivery') => {
    setDailyMealSelections(prev => {
      const currentDay = prev[day] || { preparationType: 'chef', items: {} };
      return {
        ...prev,
        [day]: { ...currentDay, preparationType: type }
      };
    });
  };

  // --- PRICING & SUMMARY CALCULATIONS ---
  const calculations = useMemo(() => {
    let chauffeurPrice = 0;
    if (chauffeurActive) {
      const rates = { sedan: 35000, suv: 60000, luxury: 120000 };
      chauffeurPrice = rates[chauffeurVehicle] * nights;
    }

    let securityPrice = 0;
    if (securityActive) {
      const rates = { standard: 25000, armed: 50000, escort: 80000 };
      securityPrice = rates[securityType] * securityPersonnelCount * nights;
    }

    let airportPrice = 0;
    if (airportActive) {
      const rates = { pickup: 20000, dropoff: 20000, roundtrip: 35000 };
      airportPrice = rates[airportTripType];
    }

    let housekeepingPrice = 0;
    if (housekeepingActive) {
      const baseDailyRate = 10000;
      if (nights <= 2 || housekeepingFrequency === 'daily') {
        housekeepingPrice = baseDailyRate * nights;
      } else {
        const serviceDays = Math.ceil(nights / 2);
        housekeepingPrice = baseDailyRate * serviceDays;
      }
    }

    let laundryPrice = 0;
    if (laundryActive) {
      laundryPrice += laundryAdultCount * 1500;
      laundryPrice += laundryKidsCount * 1000;
      laundryPrice += laundrySuitsCount * 5000;
    }

    let beddingsPrice = 0;
    if (beddingsActive) {
      beddingsPrice = (duvetCount * 5000 * nights) + (towelCount * 2500 * nights);
    }

    let shopperPrice = 0;
    if (shopperActive) {
      shopperPrice = shopperCount * 15000;
    }

    const totalConciergePrice =
      chauffeurPrice +
      securityPrice +
      airportPrice +
      housekeepingPrice +
      laundryPrice +
      beddingsPrice +
      shopperPrice;

    let totalMealPrice = 0;
    if (mealsActive) {
      Object.entries(dailyMealSelections).forEach(([dayNum, dayData]) => {
        if (parseInt(dayNum) <= nights) {
          const isChefSelected = dayData.preparationType === 'chef';

          Object.entries(dayData.items || {}).forEach(([itemId, itemData]) => {
            const menuObj = CHEF_MENU.find(m => m.id === itemId);
            if (menuObj && itemData.qty > 0) {
              const basePrice = menuObj.price;
              const chefAddon = isChefSelected ? 20000 : 0;
              totalMealPrice += (basePrice + chefAddon) * itemData.qty;

              Object.entries(itemData.proteins || {}).forEach(([protId, pQty]) => {
                const protObj = PROTEIN_OPTIONS.find(p => p.id === protId);
                if (protObj && pQty > 0) {
                  totalMealPrice += protObj.price * pQty;
                }
              });
            }
          });
        }
      });
    }

    return {
      chauffeurPrice,
      securityPrice,
      airportPrice,
      housekeepingPrice,
      laundryPrice,
      beddingsPrice,
      shopperPrice,
      totalConciergePrice,
      totalMealPrice,
      grandTotal: totalConciergePrice + totalMealPrice
    };
  }, [
    chauffeurActive, chauffeurVehicle,
    securityActive, securityType, securityPersonnelCount,
    airportActive, airportTripType,
    housekeepingActive, housekeepingFrequency,
    laundryActive, laundryAdultCount, laundryKidsCount, laundrySuitsCount,
    beddingsActive, duvetCount, towelCount,
    shopperActive, shopperCount,
    mealsActive, dailyMealSelections,
    nights
  ]);

  const lastEmittedValue = useRef<string | null>(null);

  useEffect(() => {
    if (!onChange) return;

    const selectedAddons = {
      chauffeur: chauffeurActive ? { vehicle: chauffeurVehicle, price: calculations.chauffeurPrice } : null,
      security: securityActive ? { type: securityType, personnel: securityPersonnelCount, price: calculations.securityPrice } : null,
      airport: airportActive ? { tripType: airportTripType, price: calculations.airportPrice } : null,
      housekeeping: housekeepingActive ? { frequency: housekeepingFrequency, price: calculations.housekeepingPrice } : null,
      laundry: laundryActive ? { adultItems: laundryAdultCount, kidsItems: laundryKidsCount, suits: laundrySuitsCount, price: calculations.laundryPrice } : null,
      beddings: beddingsActive ? { duvets: duvetCount, towels: towelCount, price: calculations.beddingsPrice } : null,
      personalShopper: shopperActive ? { shoppers: shopperCount, price: calculations.shopperPrice } : null,
    };

    const payload = {
      addons: selectedAddons,
      dailyMealSelections: mealsActive ? dailyMealSelections : {},
      totalConciergePrice: calculations.totalConciergePrice,
      totalMealPrice: calculations.totalMealPrice,
      grandTotal: calculations.grandTotal
    };

    const serializedPayload = JSON.stringify(payload);
    if (lastEmittedValue.current !== serializedPayload) {
      lastEmittedValue.current = serializedPayload;
      onChange(payload);
    }
  }, [
    onChange,
    chauffeurActive, chauffeurVehicle, calculations.chauffeurPrice,
    securityActive, securityType, securityPersonnelCount, calculations.securityPrice,
    airportActive, airportTripType, calculations.airportPrice,
    housekeepingActive, housekeepingFrequency, calculations.housekeepingPrice,
    laundryActive, laundryAdultCount, laundryKidsCount, laundrySuitsCount, calculations.laundryPrice,
    beddingsActive, duvetCount, towelCount, calculations.beddingsPrice,
    shopperActive, shopperCount, calculations.shopperPrice,
    mealsActive, dailyMealSelections,
    calculations.totalConciergePrice, calculations.totalMealPrice, calculations.grandTotal
  ]);

  const activeDayData = dailyMealSelections[selectedDayTab] || { preparationType: 'chef', items: {} };
  const filteredCategoryItems = CHEF_MENU.filter(m => m.category === selectedCategoryTab);

  return (
    <div className="w-full space-y-6 text-gray-100 max-w-4xl mx-auto">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" /> Concierge & Dining Services
        </h2>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Customize your stay with private culinary services, luxury add-ons, and local security.
        </p>
      </div>

      {/* --- FOOD & CHEF SELECTION MODULE --- */}
      <div className={`p-4 rounded-xl border transition-all ${mealsActive ? 'bg-gray-900/90 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/50 text-amber-400 border border-amber-800/40">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm md:text-base text-white">Daily Meals & Dining (Per Litre)</h3>
              <p className="text-xs text-gray-400">Select fresh local dishes, soups (per litre), and dining preferences per day</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={mealsActive}
            onChange={(e) => setMealsActive(e.target.checked)}
            className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
          />
        </div>

        {mealsActive && (
          <div className="mt-4 pt-4 border-t border-gray-800/80 space-y-4">
            {/* Day Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {Array.from({ length: nights }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayTab(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    selectedDayTab === day
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Day {day}
                </button>
              ))}
            </div>

            {/* Preparation Option Switch */}
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-300 font-medium">Preparation Option for Day {selectedDayTab}:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handlePrepTypeChange(selectedDayTab, 'chef')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                    activeDayData.preparationType === 'chef'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <ChefHat className="w-4 h-4 text-amber-400" /> In-House Chef 
                </button>
                <button
                  type="button"
                  onClick={() => handlePrepTypeChange(selectedDayTab, 'delivery')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                    activeDayData.preparationType === 'delivery'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Truck className="w-4 h-4 text-amber-400" /> Express Food Delivery
                </button>
              </div>
            </div>

            {/* Food Menu Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-800/80 pb-2 scrollbar-thin">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    selectedCategoryTab === cat.id
                      ? 'bg-amber-950 border border-amber-500/60 text-amber-300 shadow-sm'
                      : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Selected Category Items List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-2">
                {filteredCategoryItems.map((item) => {
                  const itemData = activeDayData.items[item.id] || { qty: 0, swallow: 'Eba', proteins: {} };
                  const qty = itemData.qty;
                  const effectivePrice = activeDayData.preparationType === 'chef' ? item.price + 20000 : item.price;
                  const isDropdownOpen = !!openMealDropdowns[item.id] && qty > 0;
                  const isSoup = item.category === 'soup';

                  return (
                    <div key={item.id} className="rounded-lg bg-gray-900/60 border border-gray-800 text-xs overflow-hidden transition-all">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="pr-2 flex-1">
                          <span className="font-medium text-gray-200 block">{item.name}</span>
                          <span className="text-[10px] text-amber-400/90 font-mono">
                            ₦{effectivePrice.toLocaleString()} / Litre {activeDayData.preparationType === 'chef' ? '(incl. ₦20k Chef Fee)' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Quantity</span>
                            <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded px-1.5 py-1">
                              <button
                                type="button"
                                onClick={() => handleMealItemChange(selectedDayTab, item.id, -1)}
                                className="p-0.5 text-gray-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold w-7 text-center text-amber-300">{qty} L</span>
                              <button
                                type="button"
                                onClick={() => handleMealItemChange(selectedDayTab, item.id, 1)}
                                className="p-0.5 text-gray-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {qty > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleDropdown(item.id)}
                              className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/50 px-2 py-1 rounded transition-colors self-end"
                            >
                              <span>Options</span>
                              {isDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* DROPDOWN OPTIONS (SWALLOW & PROTEINS) */}
                      {qty > 0 && isDropdownOpen && (
                        <div className="bg-gray-950/80 p-3 border-t border-gray-800/80 space-y-3 animate-fadeIn">
                          {/* SWALLOW SELECTION (SOUP ONLY) */}
                          {isSoup && (
                            <div className="space-y-1.5 border-b border-gray-800/80 pb-3">
                              <label className="text-[11px] font-semibold text-amber-300 block">
                                Preferred Swallow Companion:
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {SWALLOW_OPTIONS.map((swallowName) => (
                                  <button
                                    key={swallowName}
                                    type="button"
                                    onClick={() => handleSwallowChange(selectedDayTab, item.id, swallowName)}
                                    className={`py-1 px-2 text-[11px] font-medium rounded border transition-all text-center ${
                                      (itemData.swallow || 'Eba') === swallowName
                                        ? 'bg-amber-500 text-black border-amber-400 font-bold'
                                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800'
                                    }`}
                                  >
                                    {swallowName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PROTEIN SELECTION */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                                <Utensils className="w-3 h-3" /> Protein Add-ons for {item.name}
                              </span>
                              <span className="text-[10px] text-gray-400">Priced per piece</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {PROTEIN_OPTIONS.map((prot) => {
                                const pQty = itemData.proteins[prot.id] || 0;
                                return (
                                  <div key={prot.id} className="flex items-center justify-between p-1.5 rounded bg-gray-900/80 border border-gray-800 text-[11px]">
                                    <div>
                                      <span className="font-medium text-gray-300 block">{prot.name}</span>
                                      <span className="text-[10px] text-amber-400/80 font-mono">₦{prot.price.toLocaleString()} / pc</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <span className="text-[8px] text-gray-400 mb-0.5">Qty (pcs)</span>
                                      <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded px-1 py-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleProteinChange(selectedDayTab, item.id, prot.id, -1)}
                                          className="p-0.5 text-gray-400 hover:text-white"
                                        >
                                          <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="font-mono font-bold w-5 text-center text-xs text-amber-300">{pQty}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleProteinChange(selectedDayTab, item.id, prot.id, 1)}
                                          className="p-0.5 text-gray-400 hover:text-white"
                                        >
                                          <Plus className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-right text-xs font-mono text-amber-400 border-t border-gray-800 pt-2">
              Total Meal Subtotal: ₦{calculations.totalMealPrice.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* --- EXECUTIVE & CONCIERGE SERVICES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CHAUFFEUR SERVICE */}
        <div className={`p-4 rounded-xl border transition-all ${chauffeurActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Chauffeur Service</h3>
                <p className="text-xs text-gray-400">Dedicated private driver for your stay</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={chauffeurActive}
              onChange={(e) => setChchauffeurActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {chauffeurActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Vehicle Class</label>
                <div className="relative">
                  <select
                    value={chauffeurVehicle}
                    onChange={(e) => setChauffeurVehicle(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="sedan">Executive Sedan (₦35,000 / night)</option>
                    <option value="suv">Luxury SUV (₦60,000 / night)</option>
                    <option value="luxury">VIP Escort / Armored Class (₦120,000 / night)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400">
                Subtotal: ₦{calculations.chauffeurPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* SECURITY SERVICE */}
        <div className={`p-4 rounded-xl border transition-all ${securityActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Security & Escort</h3>
                <p className="text-xs text-gray-400">Close protection and escort details</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securityActive}
              onChange={(e) => setSecurityActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {securityActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Security Type</label>
                  <div className="relative">
                    <select
                      value={securityType}
                      onChange={(e) => setSecurityType(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="standard">Standard Guard (₦25k/day)</option>
                      <option value="armed">Armed Mobile Unit (₦50k/day)</option>
                      <option value="escort">Executive Protection (₦80k/day)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Personnel Count</label>
                  <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setSecurityPersonnelCount(Math.max(1, securityPersonnelCount - 1))}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-200">{securityPersonnelCount}</span>
                    <button
                      type="button"
                      onClick={() => setSecurityPersonnelCount(securityPersonnelCount + 1)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400">
                Subtotal: ₦{calculations.securityPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* AIRPORT TRANSFER */}
        <div className={`p-4 rounded-xl border transition-all ${airportActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Airport Transfer</h3>
                <p className="text-xs text-gray-400">Seamless pickup and drop-off</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={airportActive}
              onChange={(e) => setAirportActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {airportActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Transfer Option</label>
                <div className="relative">
                  <select
                    value={airportTripType}
                    onChange={(e) => setAirportTripType(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="pickup">Airport Pickup Only (₦20,000)</option>
                    <option value="dropoff">Airport Drop-off Only (₦20,000)</option>
                    <option value="roundtrip">Roundtrip Transfer (₦35,000)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400">
                Subtotal: ₦{calculations.airportPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* HOUSEKEEPING */}
        <div className={`p-4 rounded-xl border transition-all ${housekeepingActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Housekeeping</h3>
                <p className="text-xs text-gray-400">Professional cleaning services</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={housekeepingActive}
              onChange={(e) => setHousekeepingActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {housekeepingActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Service Frequency</label>
                <div className="relative">
                  <select
                    disabled={nights <= 2}
                    value={housekeepingFrequency}
                    onChange={(e) => setHousekeepingFrequency(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer disabled:opacity-50"
                  >
                    <option value="daily">Daily Service (₦10,000 / day)</option>
                    <option value="every_two_days">Once Every 2 Days (₦10,000 / session)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400">
                Subtotal: ₦{calculations.housekeepingPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* LAUNDRY */}
        <div className={`p-4 rounded-xl border transition-all ${laundryActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Laundry Service</h3>
                <p className="text-xs text-gray-400">Washing and dry cleaning</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={laundryActive}
              onChange={(e) => setLaundryActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {laundryActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Adult Items (₦1,500/item)</span>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">
                  <button type="button" onClick={() => setLaundryAdultCount(Math.max(0, laundryAdultCount - 1))}>-</button>
                  <span className="font-mono font-bold w-4 text-center">{laundryAdultCount}</span>
                  <button type="button" onClick={() => setLaundryAdultCount(laundryAdultCount + 1)}>+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Kids Items (₦1,000/item)</span>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">
                  <button type="button" onClick={() => setLaundryKidsCount(Math.max(0, laundryKidsCount - 1))}>-</button>
                  <span className="font-mono font-bold w-4 text-center">{laundryKidsCount}</span>
                  <button type="button" onClick={() => setLaundryKidsCount(laundryKidsCount + 1)}>+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Suits (₦5,000/item)</span>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">
                  <button type="button" onClick={() => setLaundrySuitsCount(Math.max(0, laundrySuitsCount - 1))}>-</button>
                  <span className="font-mono font-bold w-4 text-center">{laundrySuitsCount}</span>
                  <button type="button" onClick={() => setLaundrySuitsCount(laundrySuitsCount + 1)}>+</button>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400 pt-1">
                Subtotal: ₦{calculations.laundryPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* BEDDINGS */}
        <div className={`p-4 rounded-xl border transition-all ${beddingsActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Extra Beddings</h3>
                <p className="text-xs text-gray-400">Duvets and extra towels</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={beddingsActive}
              onChange={(e) => setBeddingsActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {beddingsActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Extra Duvet (₦5,000 / night)</span>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">
                  <button type="button" onClick={() => setDuvetCount(Math.max(0, duvetCount - 1))}>-</button>
                  <span className="font-mono font-bold w-4 text-center">{duvetCount}</span>
                  <button type="button" onClick={() => setDuvetCount(duvetCount + 1)}>+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Extra Towels (₦2,500 / night)</span>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">
                  <button type="button" onClick={() => setTowelCount(Math.max(0, towelCount - 1))}>-</button>
                  <span className="font-mono font-bold w-4 text-center">{towelCount}</span>
                  <button type="button" onClick={() => setTowelCount(towelCount + 1)}>+</button>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400 pt-1">
                Subtotal: ₦{calculations.beddingsPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* PERSONAL SHOPPER */}
        <div className={`p-4 rounded-xl border transition-all md:col-span-2 ${shopperActive ? 'bg-gray-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20' : 'bg-gray-950/60 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-white">Personal Shopper (Errand Boy/Girl)</h3>
                <p className="text-xs text-gray-400">Errands and shopping assistant (₦15,000 / shopper, Max 5)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shopperActive}
              onChange={(e) => setShopperActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
          </div>

          {shopperActive && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1">
                <button type="button" onClick={() => setShopperCount(Math.max(1, shopperCount - 1))}>-</button>
                <span className="font-mono font-bold text-xs w-6 text-center">{shopperCount}</span>
                <button type="button" onClick={() => setShopperCount(Math.min(5, shopperCount + 1))}>+</button>
              </div>
              <div className="text-right text-xs font-mono text-cyan-400">
                Subtotal: ₦{calculations.shopperPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED ORDER CALCULATION FOOTER */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-gray-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-b border-gray-800 pb-3">
          <div className="flex justify-between items-center bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-amber-400" /> Total Meals & Chef:</span>
            <span className="font-mono font-bold text-amber-400">₦{calculations.totalMealPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Concierge Services:</span>
            <span className="font-mono font-bold text-cyan-400">₦{calculations.totalConciergePrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <span className="text-xs text-gray-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Prices calculated per day and categorized for checkout & admin tabs.
          </span>
          <div className="text-right w-full sm:w-auto">
            <span className="text-xs text-gray-400 block">Grand Total</span>
            <span className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
              ₦{calculations.grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}