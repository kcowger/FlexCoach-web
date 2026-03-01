// Profile CRUD now delegated to dataSync
export type { ProfileSummary } from '@/lib/dataSync';
export {
  getProfiles,
  createProfile,
  deleteProfile,
} from '@/lib/dataSync';
