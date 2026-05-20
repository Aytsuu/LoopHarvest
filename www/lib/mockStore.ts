import { CategorySlug } from './categories';

export interface Listing {
  id: string;
  title: string;
  category: CategorySlug;
  quantity: number;
  unit: string;
  distance: number;
  city: string;
  timeAgo: string;
  donorName: string;
  donorAvatar: string;
  description: string;
  status: 'open' | 'claimed' | 'completed' | 'expired';
  photo: string;
}

export interface RequestItem {
  id: string;
  title: string;
  category: CategorySlug;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  frequency: 'one-time' | 'weekly' | 'monthly';
  distance: number;
  city: string;
  timeAgo: string;
  requesterName: string;
  requesterAvatar: string;
  description: string;
  status: 'open' | 'claimed' | 'completed' | 'expired';
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'match_found' | 'listing_claimed' | 'pickup_confirmed' | 'request_matched' | 'review_received';
  status: 'unread' | 'read';
  category?: CategorySlug;
}

export interface UserStats {
  kgDiverted: number;
  co2Saved: number;
  waterSaved: number;
  listingsPosted: number;
  requestsFulfilled: number;
  loopPoints: number;
}

const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'l-1',
    title: 'Daucus scraps & brassica stalks',
    category: 'vegetable-scraps',
    quantity: 1.5,
    unit: 'kg',
    distance: 0.4,
    city: 'San Francisco',
    timeAgo: '12m ago',
    donorName: 'Hannelore Schmidt',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannelore',
    description: 'Perfectly clean organic carrot tops and broccoli stalks. Kept refrigerated, ideal for vegetable stock or composting.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-2',
    title: 'Organic espresso grinds',
    category: 'coffee-grounds',
    quantity: 8.0,
    unit: 'kg',
    distance: 0.9,
    city: 'San Francisco',
    timeAgo: '45m ago',
    donorName: 'Andytown Coffee',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andytown',
    description: 'Fresh espresso grounds from our morning rush. Perfect for nitrogen-rich garden soil, compost, or mushroom cultivation.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-3',
    title: 'Bruised apples & soft oranges',
    category: 'fruit-waste',
    quantity: 3.5,
    unit: 'kg',
    distance: 1.8,
    city: 'San Francisco',
    timeAgo: '2h ago',
    donorName: 'Bi-Rite Market',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BiRite',
    description: 'Slightly bruised apples and soft citrus. Still great for culinary vinegar, cider makers, or animal feed.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-4',
    title: 'Spent sourdough loaves',
    category: 'bread-stale',
    quantity: 4,
    unit: 'pieces',
    distance: 1.2,
    city: 'San Francisco',
    timeAgo: '3h ago',
    donorName: 'Tartine Bakery',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tartine',
    description: 'Sourdough loaves from yesterday. Crusty and dense, perfect for croutons, bread pudding, or kvass fermentation.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-5',
    title: 'Overripe plantains and mangoes',
    category: 'fruit-waste',
    quantity: 15.0,
    unit: 'kg',
    distance: 4.8,
    city: 'São Paulo',
    timeAgo: '5h ago',
    donorName: 'Sabor da Terra',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sabor',
    description: 'Overripe mangoes and sweet plantains, perfect for culinary vinegar, sourdough baking, or animal feed.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-6',
    title: 'Spent brewer yeast slurry',
    category: 'other',
    quantity: 40.0,
    unit: 'liters',
    distance: 2.1,
    city: 'London',
    timeAgo: '6h ago',
    donorName: 'Borough Brews',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Borough',
    description: 'Fresh organic yeast slurry from our stout production. Great for marmite/vegemite creators or specialty animal feeds.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'l-7',
    title: 'Wasted okara (soy pulp)',
    category: 'vegetable-scraps',
    quantity: 25.0,
    unit: 'kg',
    distance: 3.5,
    city: 'Tokyo',
    timeAgo: '8h ago',
    donorName: 'Nippon Tofu Co.',
    donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nippon',
    description: 'High-protein fresh okara pulp from organic soybean processing. Kept cold, ideal for high-protein compost or animal feed.',
    status: 'open',
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop'
  }
];

const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: 'r-1',
    title: 'Spent grain for poultry feed',
    category: 'spent-grain',
    minQuantity: 10,
    maxQuantity: 50,
    unit: 'kg',
    frequency: 'weekly',
    distance: 2.3,
    city: 'San Francisco',
    timeAgo: '1h ago',
    requesterName: 'Feather & Comb Farm',
    requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FeatherFarm',
    description: 'Looking for organic brewery spent grain to supplement feed for our 40 laying hens. Can pick up directly in food-safe buckets.',
    status: 'open'
  },
  {
    id: 'r-2',
    title: 'Citrus peels for organic cleaners',
    category: 'fruit-peels',
    minQuantity: 2,
    maxQuantity: 5,
    unit: 'kg',
    frequency: 'one-time',
    distance: 0.7,
    city: 'San Francisco',
    timeAgo: '4h ago',
    requesterName: 'EcoSanctuary Cleaning',
    requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoSanct',
    description: 'Need orange, lemon, or grapefruit peels to infuse in vinegar for craft eco-friendly multi-surface cleaners.',
    status: 'open'
  },
  {
    id: 'r-3',
    title: 'Coffee chaff for organic compost',
    category: 'coffee-grounds',
    minQuantity: 5,
    maxQuantity: 20,
    unit: 'kg',
    frequency: 'weekly',
    distance: 1.5,
    city: 'Tokyo',
    timeAgo: '2h ago',
    requesterName: 'Midori Gardens',
    requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Midori',
    description: 'Looking for bulk coffee chaff or discarded grounds to condition our rooftop vegetable garden beds.',
    status: 'open'
  },
  {
    id: 'r-4',
    title: 'Stale artisan bread for animal feed',
    category: 'bread-stale',
    minQuantity: 15,
    maxQuantity: 40,
    unit: 'kg',
    frequency: 'weekly',
    distance: 5.0,
    city: 'Sydney',
    timeAgo: '3h ago',
    requesterName: 'Wombat Sanctuary',
    requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wombat',
    description: 'Seeking day-old bread, crusts, and crumbs from bakeries to help feed rescued farm animals and birds.',
    status: 'open'
  },
  {
    id: 'r-5',
    title: 'Unused vegetable trimmings',
    category: 'vegetable-scraps',
    minQuantity: 5,
    maxQuantity: 10,
    unit: 'kg',
    frequency: 'weekly',
    distance: 3.2,
    city: 'New York',
    timeAgo: '7h ago',
    requesterName: 'The Green Kitchen',
    requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GreenKitchen',
    description: 'Appealing for leftover carrot peelings, celery tops, and onion skins to brew vegetable broth for community soup runs.',
    status: 'open'
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'New waste match nearby',
    body: 'Someone near you just posted 1.5kg of Vegetable Scraps.',
    time: '5m ago',
    type: 'request_matched',
    status: 'unread',
    category: 'vegetable-scraps'
  },
  {
    id: 'n-2',
    title: 'Listing claimed!',
    body: 'Baker\'s Bistro claimed your stale sourdough listing.',
    time: '1h ago',
    type: 'listing_claimed',
    status: 'unread',
    category: 'bread-stale'
  },
  {
    id: 'n-3',
    title: 'Review received',
    body: 'Hannelore Schmidt left you a 5-star review for organic compost.',
    time: 'Yesterday',
    type: 'review_received',
    status: 'read'
  }
];

const INITIAL_STATS: UserStats = {
  kgDiverted: 17.4,
  co2Saved: 8.7,
  waterSaved: 870,
  listingsPosted: 12,
  requestsFulfilled: 4,
  loopPoints: 240
};

// Safe wrapper for Client-Side localStorage
const isClient = typeof window !== 'undefined';

function getStored<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.warn("Storage access failed (private browsing):", e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (isClient) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Writing to storage failed:", e);
    }
  }
}

export const mockStore = {
  getListings(): Listing[] {
    return getStored('fl_listings', INITIAL_LISTINGS);
  },

  getListing(id: string): Listing | undefined {
    return this.getListings().find(l => l.id === id);
  },

  addListing(title: string, category: CategorySlug, quantity: number, unit: string, description: string, photo?: string): Listing {
    const listings = this.getListings();
    const newListing: Listing = {
      id: `l-${Date.now()}`,
      title,
      category,
      quantity,
      unit,
      distance: +(Math.random() * 3).toFixed(1),
      city: 'San Francisco',
      timeAgo: 'Just now',
      donorName: 'You (Current User)',
      donorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
      description,
      status: 'open',
      photo: photo || 'https://images.unsplash.com/photo-1557844352-761f2565b576?q=80&w=600&auto=format&fit=crop'
    };
    listings.unshift(newListing);
    setStored('fl_listings', listings);

    // Increment user stats
    const stats = this.getUserStats();
    stats.listingsPosted += 1;
    stats.loopPoints += 15;
    setStored('fl_stats', stats);

    return newListing;
  },

  claimListing(id: string): boolean {
    const listings = this.getListings();
    const listing = listings.find(l => l.id === id);
    if (listing && listing.status === 'open') {
      listing.status = 'claimed';
      setStored('fl_listings', listings);

      // Notify donor (simulated)
      this.addNotification(
        'Listing Claimed',
        `Your listing "${listing.title}" was claimed. Arrange pickup details!`,
        'listing_claimed',
        listing.category
      );

      // Increment claimed stat
      const stats = this.getUserStats();
      stats.kgDiverted += listing.quantity;
      stats.co2Saved = +(stats.kgDiverted * 0.5).toFixed(1);
      stats.waterSaved = stats.kgDiverted * 50;
      stats.loopPoints += 25;
      setStored('fl_stats', stats);

      return true;
    }
    return false;
  },

  getRequests(): RequestItem[] {
    return getStored('fl_requests', INITIAL_REQUESTS);
  },

  getRequest(id: string): RequestItem | undefined {
    return this.getRequests().find(r => r.id === id);
  },

  addRequest(title: string, category: CategorySlug, minQuantity: number, maxQuantity: number, unit: string, frequency: 'one-time' | 'weekly' | 'monthly', description: string): RequestItem {
    const requests = this.getRequests();
    const newRequest: RequestItem = {
      id: `r-${Date.now()}`,
      title,
      category,
      minQuantity,
      maxQuantity,
      unit,
      frequency,
      distance: +(Math.random() * 4).toFixed(1),
      city: 'San Francisco',
      timeAgo: 'Just now',
      requesterName: 'You (Current User)',
      requesterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
      description,
      status: 'open'
    };
    requests.unshift(newRequest);
    setStored('fl_requests', requests);

    const stats = this.getUserStats();
    stats.loopPoints += 10;
    setStored('fl_stats', stats);

    return newRequest;
  },

  fulfillRequest(id: string): boolean {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === id);
    if (req && req.status === 'open') {
      req.status = 'claimed';
      setStored('fl_requests', requests);

      this.addNotification(
        'Request Fulfilled!',
        `You offered to fulfill "${req.title}" from ${req.requesterName}.`,
        'pickup_confirmed',
        req.category
      );

      const stats = this.getUserStats();
      stats.requestsFulfilled += 1;
      stats.kgDiverted += req.minQuantity;
      stats.co2Saved = +(stats.kgDiverted * 0.5).toFixed(1);
      stats.waterSaved = stats.kgDiverted * 50;
      stats.loopPoints += 30;
      setStored('fl_stats', stats);

      return true;
    }
    return false;
  },

  getNotifications(): NotificationItem[] {
    return getStored('fl_notifications', INITIAL_NOTIFICATIONS);
  },

  addNotification(title: string, body: string, type: NotificationItem['type'], category?: CategorySlug): NotificationItem {
    const notifications = this.getNotifications();
    const newNotification: NotificationItem = {
      id: `n-${Date.now()}`,
      title,
      body,
      time: 'Just now',
      type,
      status: 'unread',
      category
    };
    notifications.unshift(newNotification);
    setStored('fl_notifications', notifications);
    return newNotification;
  },

  markAllNotificationsAsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.status = 'read');
    setStored('fl_notifications', notifications);
  },

  deleteNotification(id: string): void {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    setStored('fl_notifications', notifications);
  },

  getUserStats(): UserStats {
    return getStored('fl_stats', INITIAL_STATS);
  }
};
