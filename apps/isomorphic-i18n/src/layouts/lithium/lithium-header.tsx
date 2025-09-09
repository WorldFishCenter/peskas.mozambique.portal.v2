"use client";

import Link from "next/link";
import { Badge, ActionIcon, Text, Popover } from "rizzui";
import cn from "@utils/class-names";
import MessagesDropdown from "@/layouts/messages-dropdown";
import NotificationDropdown from "@/layouts/notification-dropdown";
import ProfileMenu from "@/layouts/profile-menu";
import SettingsButton from "@/layouts/settings-button";
import HamburgerButton from "@/layouts/hamburger-button";
import Logo from "@components/logo";
import {
  PiBellSimpleRingingDuotone,
  PiChatsCircleDuotone,
  PiGearDuotone,
  PiMagnifyingGlassDuotone,
  PiSun,
  PiMoon,
  PiMapPinDuotone,
  PiCaretDownBold,
  PiSlidersDuotone,
} from "react-icons/pi";
import { useTheme } from "next-themes";
import HeaderMenuLeft from "@/layouts/lithium/lithium-menu";
import Sidebar from "@/layouts/hydrogen/sidebar";
import StickyHeader from "@/layouts/sticky-header";
import { FilterSelector, selectedMetricAtom } from "@/app/components/filter-selector";
import TimeRangeSelector, { selectedTimeRangeAtom } from "@/app/components/time-range-selector";
import { useSession } from "next-auth/react";
import type { TBmu } from "@repo/nosql/schema/bmu";
import LanguageLink, { getClientLanguage } from "@/app/i18n/language-link";
import useUserPermissions from "@/app/shared/file/dashboard/hooks/useUserPermissions";
import { useAtom } from 'jotai';
import { METRIC_OPTIONS } from '@/app/shared/file/dashboard/charts/types';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { changeAppLanguage } from '@/app/i18n/language-switcher';
import { USFlag } from "@components/icons/language/USFlag";
import { SWFlag } from "@components/icons/language/SWFlag";
import { useTranslation } from "@/app/i18n/client";
import Image from "next/image";
import MetricSelectorDropdown from '@/app/shared/components/MetricSelectorDropdown';

type SerializedBmu = {
  _id: string;
  BMU: string;
  group: string;
}

type CustomSession = {
  user?: {
    bmus?: Omit<TBmu, "lat" | "lng" | "treatments">[];
    userBmu?: SerializedBmu;
  }
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <ActionIcon
      aria-label="Toggle theme"
      variant="text"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "h-[34px] w-[34px] shadow backdrop-blur-md dark:bg-gray-800 md:h-9 md:w-9",
        "relative rounded-full text-gray-700 dark:text-gray-300 hover:text-gray-1000 dark:hover:text-gray-100"
      )}
    >
      {theme === "dark" ? (
        <PiSun className="h-[22px] w-auto" />
      ) : (
        <PiMoon className="h-[22px] w-auto" />
      )}
    </ActionIcon>
  );
}

function ReferenceBMU() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const userBmu = session?.user?.userBmu?.BMU;

  if (!userBmu) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-50 rounded-full">
      <PiMapPinDuotone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <span className="font-medium text-gray-900 dark:text-gray-200">{userBmu}</span>
    </div>
  );
}

// Compact Language Switcher
function CompactLanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState(() => getClientLanguage());
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLang(event.detail.language);
    };
    
    window.addEventListener('i18n-language-changed', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('i18n-language-changed', handleLanguageChange as EventListener);
    };
  }, []);

  const handleLanguageChange = (newLang: string) => {
    if (newLang === currentLang) return;
    
    changeAppLanguage(newLang);
    setCurrentLang(newLang);
    setIsOpen(false);
  };

  if (!mounted) return null;

  const languages = [
    { code: 'en', name: 'EN', icon: <USFlag className="w-4 h-3" /> },
    { code: 'sw', name: 'SW', icon: <SWFlag className="w-4 h-3" /> }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 xs:px-3 xs:py-2 sm:px-4 text-sm font-medium rounded-lg transition-colors border border-muted bg-gray-0 dark:bg-gray-50 text-gray-900 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100/80 focus:ring-2 focus:ring-blue-200",
          isOpen && "ring-2 ring-blue-200"
        )}
      >
        <span className="w-4 h-3 overflow-hidden flex items-center justify-center flex-shrink-0">
          {currentLanguage.icon}
        </span>
        <span className="hidden xs:inline text-xs sm:text-sm">{currentLanguage.name}</span>
        <PiCaretDownBold className={cn("h-3 w-3 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-gray-0 dark:bg-gray-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[1001] min-w-[100px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors first:rounded-t-md last:rounded-b-md",
                  currentLang === lang.code
                    ? "bg-blue-50 dark:bg-blue-800 text-blue-900 dark:text-blue-200"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <span className="w-4 h-3 overflow-hidden flex items-center justify-center">
                  {lang.icon}
                </span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Mobile Filters Menu - provides access to filters hidden on mobile
function MobileFiltersMenu({ lang }: { lang?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation(lang || 'en');
  
  // Detect homepage and special pages
  const isHomepage = pathname === '/' || (pathname && /^\/[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(pathname));
  const isCatchCompositionPage = pathname?.includes('/catch_composition');
  
  // Don't show the mobile filters menu on homepage
  if (isHomepage) return null;

  return (
    <div className="flex items-center lg:hidden ml-2 xs:ml-3 sm:ml-4">
      <Popover 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        placement="bottom-end"
      >
        <Popover.Trigger>
          <button
            className="flex items-center gap-1.5 px-2 py-1.5 xs:px-3 xs:py-2 sm:px-4 text-sm font-medium rounded-lg transition-colors border border-muted bg-gray-0 dark:bg-gray-50 text-gray-900 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100/80 focus:ring-2 focus:ring-blue-200"
            aria-label="Additional filters"
          >
            <PiSlidersDuotone className="h-4 w-4" />
            <span className="hidden xs:inline text-sm">{t('text-filters') || 'Filters'}</span>
          </button>
        </Popover.Trigger>
        <Popover.Content className="w-72 p-4 bg-gray-0 dark:bg-gray-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">
              {t('text-additional-filters') || 'Additional Filters'}
            </div>
            
            {/* Metric Selector for mobile */}
            {!isCatchCompositionPage && (
              <div className="sm:hidden">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('text-metric') || 'Metric'}
                </label>
                <MetricSelectorDropdown />
              </div>
            )}
            
            {/* District Filter for mobile */}
            <div className="lg:hidden">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('text-districts') || 'Districts'}
              </label>
              <FilterSelector />
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
}

function HeaderMenuRight({ lang }: { lang?: string }) {
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '';
  const [selectedMetric, setSelectedMetric] = useAtom(selectedMetricAtom);
  const { t } = useTranslation(lang || 'en');
  
  // Detect homepage (with or without language prefix)
  const isHomepage = pathname === '/' || /^\/[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(pathname);
  
  // Detect catch composition page
  const isCatchCompositionPage = pathname?.includes('/catch_composition');

  return (
    <div className="ms-auto flex shrink-0 items-center gap-1 text-gray-700 dark:text-gray-300 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
      {/* Mobile-first approach: Show essential controls first */}
      
      {/* Time Range - Always visible but compact on mobile */}
      <div className="flex-shrink-0">
        <TimeRangeSelector />
      </div>
      
      {/* Metric Selector - Hide on homepage and catch_composition, show from sm up */}
      {!isHomepage && !isCatchCompositionPage && (
        <div className="hidden sm:flex flex-shrink-0">
          <MetricSelectorDropdown />
        </div>
      )}
      
      {/* District Filter - Show from md up for non-homepage */}
      {!isHomepage && (
        <div className="hidden lg:flex flex-shrink-0">
          <FilterSelector />
        </div>
      )}
      
      {/* Language Switcher - Always visible but more compact on mobile */}
      <div className="flex-shrink-0">
        <CompactLanguageSwitcher />
      </div>
      
      {/* Theme Toggle - Always visible */}
      <div className="flex-shrink-0">
        <ThemeToggle />
      </div>
      
      {/* Profile Menu - Always visible */}
      <div className="flex-shrink-0">
        <ProfileMenu
          buttonClassName="w-auto sm:w-auto p-1 border border-gray-300 dark:border-gray-700"
          avatarClassName="!w-6 !h-6 xs:!w-7 xs:!h-7 sm:!h-8 sm:!w-8"
          lang={lang}
        />
      </div>
    </div>
  );
}

export default function Header({ lang }: { lang?: string }) {
  const { theme = 'light' } = useTheme();
  const colorMode = (theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  return (
    <StickyHeader
      className={"z-[990] justify-between 2xl:py-5 2xl:pl-6 3xl:px-8"}
    >
      <div className="hidden items-center gap-3 xl:flex">
        <LanguageLink
          aria-label="Site Logo"
          href="/"
          className="me-4 hidden w-[200px] shrink-0 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 lg:me-5 xl:block"
        >
          <div className="flex items-center gap-3">
            <Logo className="max-w-[200px] h-12" colorMode={colorMode} />
            <Image src="/mozambique-flag.svg" alt="Mozambique flag" width={32} height={32} className="h-8 w-auto" />
          </div>
        </LanguageLink>
        <HeaderMenuLeft lang={lang} />
      </div>
      <div className="flex w-full items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 xl:w-auto 2xl:gap-5 3xl:gap-6">
        <div className="flex w-full items-center xl:w-auto">
          <HamburgerButton
            view={<Sidebar className="static w-full 2xl:w-full" lang={lang} />}
            customSize="90%"
          />
          <LanguageLink
            aria-label="Site Logo"
            href="/"
            className="me-2 w-7 xs:me-2 xs:w-9 sm:me-3 sm:w-11 md:w-12 lg:w-14 shrink-0 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 xl:hidden"
          >
            <Logo iconOnly={true} className="h-5 xs:h-7 sm:h-9 md:h-10 w-auto" colorMode={colorMode} />
          </LanguageLink>
          
          {/* Mobile-only additional filters */}
          <MobileFiltersMenu lang={lang} />
        </div>
        <HeaderMenuRight lang={lang} />
      </div>
    </StickyHeader>
  );
}
