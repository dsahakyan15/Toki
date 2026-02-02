// Model
export type { User, UserProfile, UserSearchResult } from './model/types';

// API
export {
  getUserProfile,
  getUserLikes,
  getUserPlaylists,
  getUserFriends,
} from './api/get-user';
