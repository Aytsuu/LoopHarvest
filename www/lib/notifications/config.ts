export type NotificationChannel = 'in_app' | 'push' | 'email';

export type NotificationTypePreference = {
  in_app: boolean;
  push: boolean;
  email: boolean;
};

export type NotificationPreferencesMap = Record<string, NotificationTypePreference>;

export const NOTIFICATION_TYPE_DEFINITIONS = [
  {
    type: 'listing_claimed',
    label: 'Listing Claimed',
    description: 'When someone claims your listing.',
    category: 'Transactional',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'listing_completed',
    label: 'Listing Completed',
    description: 'When a pickup is completed.',
    category: 'Transactional',
    locked: [] as NotificationChannel[],
  },
  {
    type: 'request_fulfilled',
    label: 'Request Fulfilled',
    description: 'When your request is marked fulfilled.',
    category: 'Transactional',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'message_received',
    label: 'Message Received',
    description: 'When another member sends you a chat message.',
    category: 'Transactional',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'match_found',
    label: 'Match Found',
    description: 'When a new listing matches one of your requests.',
    category: 'Matching',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'request_nearby',
    label: 'Request Nearby',
    description: 'When a nearby request matches categories you usually donate.',
    category: 'Matching',
    locked: [] as NotificationChannel[],
  },
  {
    type: 'review_received',
    label: 'Review Received',
    description: 'When someone leaves you a review.',
    category: 'Social',
    locked: [] as NotificationChannel[],
  },
  {
    type: 'loop_points_milestone',
    label: 'Loop Points Milestone',
    description: 'When you cross an impact milestone.',
    category: 'Social',
    locked: [] as NotificationChannel[],
  },
  {
    type: 'maintenance_scheduled',
    label: 'Maintenance Scheduled',
    description: 'Upcoming platform maintenance.',
    category: 'System',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'account_security',
    label: 'Account Security',
    description: 'Password changes and sensitive account access events.',
    category: 'System',
    locked: ['in_app', 'email'] as NotificationChannel[],
  },
  {
    type: 'release_minor',
    label: 'Minor Release',
    description: 'Low-friction app updates and improvements.',
    category: 'Release',
    locked: ['in_app'] as NotificationChannel[],
  },
  {
    type: 'release_breaking',
    label: 'Breaking Release',
    description: 'Critical updates that require user attention.',
    category: 'Release',
    locked: ['in_app', 'push', 'email'] as NotificationChannel[],
  },
] as const;

export const DEFAULT_NOTIFICATION_TYPE_PREFERENCES: NotificationPreferencesMap = {
  listing_claimed: { in_app: true, push: true, email: true },
  listing_completed: { in_app: true, push: false, email: false },
  request_fulfilled: { in_app: true, push: true, email: true },
  message_received: { in_app: true, push: true, email: true },
  match_found: { in_app: true, push: true, email: true },
  request_nearby: { in_app: true, push: false, email: false },
  review_received: { in_app: true, push: false, email: true },
  loop_points_milestone: { in_app: true, push: false, email: false },
  maintenance_scheduled: { in_app: true, push: false, email: true },
  account_security: { in_app: true, push: true, email: true },
  release_minor: { in_app: true, push: false, email: false },
  release_breaking: { in_app: true, push: true, email: true },
};

export function mergeNotificationPreferences(
  current: unknown,
): NotificationPreferencesMap {
  const next: NotificationPreferencesMap = { ...DEFAULT_NOTIFICATION_TYPE_PREFERENCES };

  if (!current || typeof current !== 'object' || Array.isArray(current)) {
    return next;
  }

  for (const [type, value] of Object.entries(current as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }

    const channels = value as Partial<NotificationTypePreference>;
    next[type] = {
      in_app: typeof channels.in_app === 'boolean' ? channels.in_app : next[type]?.in_app ?? true,
      push: typeof channels.push === 'boolean' ? channels.push : next[type]?.push ?? false,
      email: typeof channels.email === 'boolean' ? channels.email : next[type]?.email ?? false,
    };
  }

  return next;
}
