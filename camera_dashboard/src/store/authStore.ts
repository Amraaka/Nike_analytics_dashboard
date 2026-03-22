import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Demo credentials - any non-empty credentials work for demonstration
const DEMO_USERS: Record<string, User> = {
  'admin@gmail.com': { name: 'Админ', email: 'admin@gmail.com', role: 'Admin' },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, password: string) => {
        if (!email?.trim() || !password?.trim()) return false;

        // Demo: accept any email/password, use known user or create from email
        const user =
          DEMO_USERS[email.toLowerCase()] ??
          ({
            name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            email,
            role: 'Admin',
          } satisfies User);

        set({ user, isAuthenticated: true });
        return true;
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'camera-dashboard-auth',
      skipHydration: true,
    }
  )
);
