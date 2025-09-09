import { routes } from '@/config/routes';
import { DUMMY_ID } from '@/config/constants';

export type SubMenuItemType = {
  name: string;
  href: string;
};

export type DropdownItemType = {
  name: string;
  icon: string;
  description?: string;
  href?: string;
  subMenuItems?: SubMenuItemType[];
};

export type LithiumMenuItem = {
  [key: string]: {
    name: string;
    type: string;
    dropdownItems: DropdownItemType[];
  };
};

export const lithiumMenuItems: LithiumMenuItem = {
  about: {
    name: 'nav-about',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-about',
        href: '/about',
        icon: 'InfoIcon',
      },
    ],
  },
  catch: {
    name: 'nav-catch',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-aggregated',
        href: routes.catch,
        icon: 'FishIcon',
      },
    ],
  },
  revenue: {
    name: 'nav-revenue',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-revenue',
        href: routes.revenue,
        icon: 'CurrencyDollar',
      },
    ],
  },
  catch_composition: {
    name: 'nav-catch-composition',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-catch-composition',
        href: routes.catch_composition,
        icon: 'ChartPie',
      },
    ],
  },
  ask_data: {
    name: 'nav-ask-data',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-ask-data',
        href: '/ask-data',
        icon: 'ZoomQuestion',
      },
    ],
  },
  map: {
    name: 'nav-map',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-map',
        href: routes.map,
        icon: 'MapIcon',
      },
    ],
  },
  widgets: {
    name: 'nav-widgets',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-cards',
        href: routes.widgets.cards,
        icon: 'DicesIcon',
      },
      {
        name: 'nav-charts',
        href: routes.widgets.charts,
        icon: 'PieChartCurrencyIcon',
      },
      {
        name: 'nav-charts',
        href: routes.forms.personalInformation,
        icon: 'PieChartCurrencyIcon',
      },
    ],
  },
  forms: {
    name: 'nav-forms',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-account-settings',
        href: routes.forms.profileSettings,
        icon: 'UserSettingsIcon',
      },
      {
        name: 'nav-notification-preference',
        href: routes.forms.notificationPreference,
        icon: 'NotificationSettingsIcon',
      },
      {
        name: 'nav-personal-information',
        href: routes.forms.personalInformation,
        icon: 'UserInfoIcon',
      },
      {
        name: 'nav-newsletter',
        href: routes.forms.newsletter,
        icon: 'NewsletterAnnouncement',
      },
    ],
  },
  groups: {
    name: 'nav-groups',
    type: 'link',
    dropdownItems: [
      {
        name: 'nav-control',
        href: routes.groups.control,
        icon: 'PageBlankIcon',
      },
      {
        name: 'nav-iia',
        href: routes.groups.iia,
        icon: 'PageBlankIcon',
      },
      {
        name: 'nav-cia',
        href: routes.groups.cia,
        icon: 'PageBlankIcon',
      },
      {
        name: 'nav-wbcia',
        href: routes.groups.wbcia,
        icon: 'PageBlankIcon',
      },
      {
        name: 'nav-aia',
        href: routes.groups.aia,
        icon: 'PageBlankIcon',
      },      
    ],
  },  
};

export type LithiumMenuItemsKeys = keyof typeof lithiumMenuItems;
