import { routes } from '@/config/routes';
import { DUMMY_ID } from '@/config/constants';
import {
  PiFishDuotone,
  PiInfoDuotone,
  PiHouseLineDuotone,
  PiCurrencyDollarDuotone,
  PiChartPieDuotone
} from 'react-icons/pi';

// Note: do not add href in the label object, it is rendering as label
export const menuItems = [
  // Home
  {
    name: 'Home',
    href: routes.home,
    icon: <PiHouseLineDuotone />,
  },
  // Catch
  {
    name: 'Catch',
    href: routes.catch,
    icon: <PiFishDuotone />,
  },
  // Revenue
  {
    name: 'Revenue',
    href: routes.revenue,
    icon: <PiCurrencyDollarDuotone />,
  },
  // Catch Composition
  {
    name: 'Catch Composition',
    href: routes.catch_composition,
    icon: <PiChartPieDuotone />,
  },
  // About page
  {
    name: 'About',
    href: routes.about,
    icon: <PiInfoDuotone />,
  },
];
