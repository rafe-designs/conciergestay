'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CHEF_MENU, PROTEIN_OPTIONS } from './ConciergeBooking'; // Import central datasets

interface Props {
  dailyMealSelections: any;
  addons: any;
}

export default function MealScheduleDisplay({ dailyMealSelections, addons }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mealDays = useMemo(() => {
    if (!dailyMealSelections) return null;
    try {
      return typeof dailyMealSelections === 'string'
        ? JSON.parse(dailyMealSelections)
        : dailyMealSelections;
    } catch {
      return null;
    }
  }, [dailyMealSelections]);

  const addonList = useMemo(() => {
    if (!addons) return null;
    try {
      return typeof addons === 'string' ? JSON.parse(addons) : addons;
    } catch {
      return null;
    }
  }, [addons]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-3">
          Daily Meal Selections
        </h4>

        {!mealDays || Object.keys(mealDays).length === 0 ? (
          <p className="text-gray-400 text-sm">No meal selections recorded.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(mealDays).map(([dayNum, dayData]: [string, any]) => {
              const items = dayData?.items || {};
              const prepType = dayData?.preparationType || 'chef';
              const itemEntries = Object.entries(items);

              if (itemEntries.length === 0) return null;

              return (
                <div key={dayNum} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h5 className="text-sm font-bold text-gray-200">Day {dayNum}</h5>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 capitalize">
                      {prepType === 'chef' ? '👨‍🍳 In-House Chef' : '🚚 Express Delivery'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {itemEntries.map(([mealId, itemData]: [string, any]) => {
                      const menuObj = CHEF_MENU.find(m => m.id === mealId);
                      const name = menuObj ? menuObj.name : mealId;
                      const category = menuObj ? menuObj.category : 'Meal';
                      const qty = itemData.qty || 0;
                      const proteins = itemData.proteins || {};

                      return (
                        <div key={mealId} className="space-y-1.5 bg-gray-950/50 p-2.5 rounded-lg border border-gray-800/80">
                          <div className="flex flex-wrap items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
                                {category}
                              </span>
                              <span className="text-gray-200 font-medium">{name}</span>
                            </div>

                            <span className="text-xs font-mono text-gray-400">
                              {qty} Litre{qty > 1 ? 's' : ''}
                            </span>
                          </div>

                          {Object.keys(proteins).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {Object.entries(proteins).map(([protId, pQty]: [string, any]) => {
                                const protObj = PROTEIN_OPTIONS.find(p => p.id === protId);
                                return (
                                  <span key={protId} className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                                    + {pQty}x {protObj ? protObj.name : protId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-3">
          Selected Add-ons & Services
        </h4>

        {!addonList || Object.keys(addonList).length === 0 ? (
          <p className="text-gray-400 text-sm">No add-ons selected.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(addonList).map(([key, val]: [string, any], idx) => {
              if (!val) return null;
              return (
                <div key={idx} className="p-3 rounded-lg bg-gray-900/40 border border-gray-800 text-sm text-gray-200 flex justify-between items-center">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-cyan-400 font-mono text-xs">
                    ₦{val.price?.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}