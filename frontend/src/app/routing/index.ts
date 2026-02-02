export const ROUTES = {
  HOME: '/',
  LISTEN: '/listen',
  PROFILE: '/profile',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  TRACK: (id: number) => `/track/${id}`,
} as const;
