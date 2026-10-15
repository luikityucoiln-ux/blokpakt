export interface Service {
  id: string;
  label: string;
  description: string;
  batchPrice: number;
  soloPrice: number;
  priceId: string;
  icon: string;
  included: string[];
  excluded: string[];
}

export interface Provider {
  id: string;
  name: string;
  initials: string;
  publicId: string;
  services: string[];
  rating: number;
  jobs: number;
  distance: string;
  blockCaptain?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: 'lawn', label: 'Lawn Care', description: 'Mowing, edging, and cleanup',
    batchPrice: 45, soloPrice: 50, priceId: 'price_1UAu4SEJF8FW6JeNvwIUueOx', icon: '🌿',
    included: ['Mow and edge accessible lawn areas', 'Blow clippings from walkways and driveways', 'Basic cleanup of the serviced area'],
    excluded: ['Overgrown-lot restoration over 6 inches', 'Tree trimming or hedge work', 'Bagging and hauling without an add-on'],
  },
  {
    id: 'gutter', label: 'Gutter Cleaning', description: 'Full flush, downspout clear, debris removal',
    batchPrice: 162, soloPrice: 180, priceId: 'price_1UAu4XEJF8FW6JeNIwausphW', icon: '🏠',
    included: ['Remove accessible gutter debris', 'Flush gutters and downspouts', 'Clear the ground-level work area'],
    excluded: ['Structural gutter repairs', 'Unsafe roof access', 'Interior drainage repairs'],
  },
  {
    id: 'pressure', label: 'Pressure Washing', description: 'Driveway, walkway, and exterior surfaces',
    batchPrice: 198, soloPrice: 220, priceId: 'price_1UAu4dEJF8FW6JeNLy1JKH22', icon: '💧',
    included: ['Wash driveway and walkway surfaces', 'Apply surface-safe cleaning solution', 'Rinse adjacent work areas'],
    excluded: ['Paint removal', 'Window cleaning', 'Sealed-stone restoration'],
  },
  {
    id: 'snow', label: 'Snow Removal', description: 'Driveway and walkway clearing with salt',
    batchPrice: 58, soloPrice: 64, priceId: 'price_1UAu4fEJF8FW6JeNddVHVpel', icon: '❄️',
    included: ['Clear driveway and front walkway', 'Create a safe path to the entry', 'Stack snow at the curbside edge'],
    excluded: ['Hauling snow off-site', 'Roof snow removal', 'Clearing private roads'],
  },
];

export const PROVIDERS: Provider[] = [
  { id: 'marcus-t', name: 'Marcus T.', initials: 'MT', publicId: 'BP-501231', services: ['lawn', 'gutter', 'pressure', 'snow'], rating: 4.9, jobs: 312, distance: '2.4 mi', blockCaptain: true },
  { id: 'devon-r', name: 'Devon R.', initials: 'DR', publicId: 'BP-583904', services: ['lawn', 'gutter', 'pressure', 'snow'], rating: 4.7, jobs: 189, distance: '8.1 mi' },
  { id: 'priya-s', name: 'Priya S.', initials: 'PS', publicId: 'BP-672148', services: ['lawn', 'gutter', 'pressure', 'snow'], rating: 4.8, jobs: 241, distance: '13.5 mi' },
];
