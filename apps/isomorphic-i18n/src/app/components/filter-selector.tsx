"use client";

import { ActionIcon, Checkbox, Input, Popover } from "rizzui";
import { TbFilterCog } from "react-icons/tb";
import { ChangeEvent, useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react"
import type { DefaultSession } from 'next-auth';
import find from 'lodash/find';
import get from 'lodash/get';
import values from 'lodash/values';
import isEmpty from 'lodash/isEmpty';
import { useAtom, atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import Fuse from "fuse.js";
import { MetricKey } from "@/app/shared/file/dashboard/charts/types";

import type { TDistrict } from "@repo/nosql/schema/district";
import SimpleBar from '@ui/simplebar';
import useUserPermissions from "../shared/file/dashboard/hooks/useUserPermissions";
import { useTranslation } from "@/app/i18n/client";
import cn from "@utils/class-names";
import { api } from "@/trpc/react";

type DropdownTypes = {
  sectionName: string;
  units: {
    value: string
  }[];
};

type CustomSession = {
  user?: {
    districts?: Omit<TDistrict, "lat" | "lng">[]
  }
}

const sessObjectToDropdown = (session: DefaultSession & CustomSession) => {
  return values(session.user?.districts).reduce((prev: DropdownTypes[], cur: Omit<TDistrict, "lat" | "lng">) => 
    find(prev, { sectionName: cur.region })
    ?
      prev.map((item) => {
        if (item.sectionName === cur.region) {
        return {
            sectionName: cur.region,
            units: [
              ...(get(find(prev, { sectionName: cur.region }), 'units', [])),
              { value: cur.district }
            ]
          } as DropdownTypes        
        }

        return item
      })
    : 
      [
        ...prev,
        {
          sectionName: cur.region,
          units: [
            { value: cur.district }
          ]
        } as DropdownTypes
      ]
  , [])
}

export const dropdownAtom = atomWithStorage<DropdownTypes[]>('dropdown', [], undefined, { getOnInit: true });
// By default, select both Mozambique districts: Palma and Mocimboa
export const districtsAtom = atomWithStorage<string[]>('districts', ['Palma', 'Mocimboa'], undefined, { getOnInit: true });
export const viewModeAtom = atomWithStorage<'district' | 'region'>('viewMode', 'district', undefined, { getOnInit: true });

// Global metric selector atom
export const selectedMetricAtom = atom<MetricKey>("mean_cpue");

// Revenue-specific metric selector atom
export const selectedRevenueMetricAtom = atom<MetricKey>("estimated_revenue_TZS");



export const FilterSelector = () => {
  const { t } = useTranslation("common");
  const [searchFilter, setSearchFilter] = useState("");
  const [filteredList, setFilteredList] = useState<string[]>([]);
  const [fuse, setFuse] = useState<Fuse<string>>();
  const [isOpen, setIsOpen] = useState(false);
  const { data: districts = [] } = api.monthlySummary.districts.useQuery();
  const [selectedDistricts, setSelectedDistricts] = useAtom(districtsAtom);
  const prevValidDistrictsRef = useRef<string[]>([]);

  // Filter out null/undefined values and ensure districts are strings - memoized to prevent infinite loops
  const validDistricts = useMemo(() => {
    if (!districts || !Array.isArray(districts)) return [];
    return districts.filter((district): district is string => 
      district !== null && district !== undefined && typeof district === 'string'
    );
  }, [districts]);

  useEffect(() => {
    // Only update if the validDistricts array has actually changed
    if (JSON.stringify(prevValidDistrictsRef.current) !== JSON.stringify(validDistricts)) {
      setFilteredList(validDistricts);
      setFuse(new Fuse(validDistricts, { includeScore: true, threshold: 0.3 }));
      prevValidDistrictsRef.current = validDistricts;
    }
  }, [validDistricts]); // Only depend on validDistricts
  
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!fuse) return;
    setSearchFilter(e.target.value);
    if (e.target.value) {
      const result = fuse.search(e.target.value);
      setFilteredList(result.map((res) => res.item));
    } else {
      setFilteredList(validDistricts);
    }
  };

  const selectedCount = selectedDistricts.length;
  const totalCount = validDistricts.length;

  return (
    <Popover isOpen={isOpen} setIsOpen={setIsOpen} placement="bottom-end">
      <Popover.Trigger>
        <ActionIcon
          variant="text"
          className="relative flex items-center justify-center h-[34px] w-[34px] bg-gray-0 dark:bg-gray-50 border border-muted rounded-lg text-gray-500 dark:text-gray-400 md:h-9 md:w-9"
        >
          <TbFilterCog className="h-5 w-5 md:h-6 md:w-6" />
          {selectedCount > 0 && selectedCount < totalCount && (
            <span className="absolute -top-1 -right-1 bg-gray-200 dark:bg-gray-300 text-gray-900 dark:text-gray-700 text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center border border-white dark:border-gray-50">
              {selectedCount}
            </span>
          )}
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content className="w-[280px] sm:w-[350px] bg-gray-0 dark:bg-gray-50 border border-muted rounded-lg p-4">
        <div className="mb-2">
          <Input
            placeholder="Search districts..."
            value={searchFilter}
            onChange={handleSearchChange}
            className="mb-2 bg-gray-0 dark:bg-gray-50 text-gray-900 dark:text-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{selectedCount} of {totalCount} districts selected</span>
            {selectedCount > 0 && (
              <button
                className="text-primary hover:text-primary-dark"
                onClick={() => setSelectedDistricts([])}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <SimpleBar className="max-h-[300px] md:max-h-[600px]">
            {filteredList.map((district) => (
              <div key={district} className="flex items-center justify-between pr-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-100/80 rounded-lg">
                <div className="flex-grow">
                  <Checkbox
                    key={district}
                    label={<span className="text-gray-900 dark:text-gray-700">{district}</span>}
                    checked={selectedDistricts.includes(district)}
                    onChange={() => {
                      if (selectedDistricts.includes(district)) {
                        setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
                      } else {
                        setSelectedDistricts([...selectedDistricts, district]);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </SimpleBar>
        </div>
      </Popover.Content>
    </Popover>
  );
};

const FilterGroup = ({
  districtSection,
  searchFilter,
  viewMode,
  referenceDistrict
}: {
  districtSection: DropdownTypes | string;
  searchFilter: string;
  viewMode?: 'district' | 'region';
  referenceDistrict?: string | null;
}) => {
  const [districts, setDistricts] = useAtom(districtsAtom);
  const { data: session } = useSession();
  const { isAdmin, userPreferences, setUserPreferences } = useUserPermissions();
  const { t } = useTranslation("common");

  const handleDistrictSelect = (unit: string) => {
    // For region view in admin mode, ensure only one district is selected per region
    if (isAdmin && viewMode === 'region' && typeof districtSection !== 'string') {
      const section = districtSection as DropdownTypes;
      
      // Remove all other districts from this region
      const filteredDistricts = districts.filter(district => {
        // Check if this district is from a different region
        if (section.units.some(u => u.value === district)) {
          return false; // Remove districts from this region
        }
        return true; // Keep districts from other regions
      });
      
      // Add the newly selected district
      setDistricts([...filteredDistricts, unit]);
      return;
    }
    
    // Standard multi-select behavior for other cases
    if (districts.includes(unit)) {
      setDistricts(districts.filter((filter) => filter !== unit));
    } else {
      setDistricts([...districts, unit]);
    }
  };
  
  const handleReferenceSelect = (unit: string) => {
    if (isAdmin) {
      // Toggle reference district
      const newSelectedRegion = referenceDistrict === unit ? undefined : unit;
      setUserPreferences({ ...userPreferences, selectedRegion: newSelectedRegion });
      
      // Also select the district if it's not already selected
      if (referenceDistrict !== unit && !districts.includes(unit)) {
        // For region view, we need to handle region selection differently
        if (viewMode === 'region' && typeof districtSection !== 'string') {
          const section = districtSection as DropdownTypes;
          
          // Remove all other districts from this region
          const filteredDistricts = districts.filter(district => {
            if (section.units.some(u => u.value === district)) {
              return false; // Remove districts from this region
            }
            return true; // Keep districts from other regions
          });
          
          // Add the newly selected district
          setDistricts([...filteredDistricts, unit]);
        } else {
          // Standard selection for district view
          setDistricts([...districts, unit]);
        }
      }
    }
  };

  if (typeof districtSection === "string" && searchFilter) {
    const unit = districtSection as string;
    const isReferenceDistrict = referenceDistrict === unit;

    return (
      <div className="flex items-center justify-between pr-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-100/80 rounded-lg">
        <div className="flex-grow">
          <Checkbox
            key={unit}
            label={<span className="text-gray-900 dark:text-gray-700">{unit}</span>}
            checked={districts.includes(unit)}
            onChange={() => handleDistrictSelect(unit)}
          />
        </div>
        {isAdmin && (
          <button
            className={cn(
              "ml-4 text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center", 
              isReferenceDistrict ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
            )}
            onClick={() => handleReferenceSelect(unit)}
            title="Set as reference"
          >
            ★
          </button>
        )}
      </div>
    );
  } else {
    const section = districtSection as DropdownTypes;
    
    // In region view, we only check if any district from this region is selected
    const isRegionSelected = isAdmin && viewMode === 'region' 
      ? section.units.some(unit => districts.includes(unit.value))
      : section.units.every(unit => districts.includes(unit.value));

    const handleSectionSelect = () => {
      // For region view in admin mode, select only one district per region
      if (isAdmin && viewMode === 'region') {
        if (isRegionSelected) {
          // Remove all districts from this region
          setDistricts(districts.filter(district => !section.units.some(unit => unit.value === district)));
        } else {
          // Add the first district from this region, remove any others
          const filteredDistricts = districts.filter(district => !section.units.some(unit => unit.value === district));
          setDistricts([...filteredDistricts, section.units[0].value]);
        }
        return;
      }
      
      // Standard behavior for other cases
      if (isRegionSelected) {
        setDistricts(
          districts.filter(
            (filter) =>
              !section.units.flatMap((unit) => unit.value).includes(filter)
          )
        );
      } else {
        setDistricts([
          ...districts,
          ...section.units.map((unit) => unit.value),
        ]);
      }
    };

    // Check if this section has the reference district
    const hasReferenceDistrict = referenceDistrict && section.units.some(unit => unit.value === referenceDistrict);

    return (
      <div className="border-b border-gray-100 last:border-0 pb-2 mb-2 last:mb-0">
        <div className="flex items-center mb-1">
          <Checkbox
            label={
              <span className={cn(
                "font-medium",
                hasReferenceDistrict ? "text-yellow-600" : ""
              )}>
                {section.sectionName}
                {hasReferenceDistrict && <span className="ml-1 text-yellow-500">★</span>}
              </span>
            }
            checked={isRegionSelected}
            onChange={handleSectionSelect}
          />
        </div>
        <div className="mt-1 ml-6 space-y-1">
          {section.units.map((unit) => {
            // In region view for admin, only one district can be selected per region
            const disabled = isAdmin && viewMode === 'region' && isRegionSelected && 
              !districts.includes(unit.value);
            
            // Check if this is the reference district
            const isReferenceDistrict = referenceDistrict === unit.value;
            
            return (
              <div key={unit.value} className="flex items-center justify-between pr-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-100/80 rounded-lg">
                <div className="flex-grow">
                  <Checkbox
                    label={<span className="text-gray-900 dark:text-gray-700">{unit.value}</span>}
                    checked={districts.includes(unit.value)}
                    onChange={() => handleDistrictSelect(unit.value)}
                    disabled={disabled}
                    className={disabled ? "opacity-50" : ""}
                  />
                </div>
                {isAdmin && !disabled && (
                  <button
                    className={cn(
                      "ml-4 text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center", 
                      isReferenceDistrict ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
                    )}
                    onClick={() => handleReferenceSelect(unit.value)}
                    title="Set as reference"
                  >
                    ★
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
};