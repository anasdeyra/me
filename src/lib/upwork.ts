// Upwork badge label from the settings value; shared by the home trust strip and the CV.
import { t } from '@/i18n';

const keys = {
  'rising-talent': 'upwork.badge.risingTalent',
  'top-rated': 'upwork.badge.topRated',
  'top-rated-plus': 'upwork.badge.topRatedPlus',
  'expert-vetted': 'upwork.badge.expertVetted',
} as const;

export const upworkBadgeLabel = (badge: keyof typeof keys) => t(keys[badge]);
