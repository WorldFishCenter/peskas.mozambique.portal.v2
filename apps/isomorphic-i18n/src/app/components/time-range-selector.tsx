"use client";

import { useState } from "react";
import { useAtom, atom } from "jotai";
import { PiCaretDownBold } from "react-icons/pi";
import cn from "@utils/class-names";
import { useTranslation } from "@/app/i18n/client";

// Global time range selector atom and options
export const TIME_RANGES = [
  { label: "Last 3 months", value: 3 },
  { label: "Last 6 months", value: 6 },
  { label: "Last year", value: 12 },
  { label: "Last 6 years", value: 72 },
  { label: "All time", value: "all" },
];

export const selectedTimeRangeAtom = atom<string | number>(6);

export default function TimeRangeSelector() {
  const { t } = useTranslation("common");
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedTimeRangeAtom);
  const [isOpen, setIsOpen] = useState(false);

  // Translated time range options
  const translatedTimeRanges = [
    { label: t("text-last-3-months") || "Last 3 months", value: 3 },
    { label: t("text-last-6-months") || "Last 6 months", value: 6 },
    { label: t("text-last-year") || "Last year", value: 12 },
    { label: t("text-all-time") || "All time", value: "all" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-muted bg-gray-0 dark:bg-gray-50 text-gray-900 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100/80 focus:ring-2 focus:ring-blue-200",
          isOpen && "ring-2 ring-blue-200"
        )}
      >
        <span className="truncate">
          {translatedTimeRanges.find(r => r.value === selectedTimeRange)?.label || translatedTimeRanges[0].label}
        </span>
        <PiCaretDownBold className={cn("h-3 w-3 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1/2 sm:left-auto sm:right-0 top-full mt-1 w-48 bg-gray-0 dark:bg-gray-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[1001] max-h-96 overflow-y-auto">
            <div className="p-2">
              {translatedTimeRanges.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedTimeRange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-2 py-1.5 text-left text-sm rounded transition-colors",
                    selectedTimeRange === option.value
                      ? "bg-blue-50 dark:bg-blue-800 text-blue-900 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 