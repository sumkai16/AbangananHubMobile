import { createContext, useContext, useState, type ReactNode } from 'react';

import type { PropertyFilters } from './properties';

// Shared between (tabs)/index.tsx and the search modal (`/search`) so the
// modal can edit location/type/price/verified/sort and have Browse pick up
// the change on close — a plain context instead of route params because
// the modal is a *different screen*, not a param on Browse's own route, and
// expo-router has no clean way to push params onto an already-mounted
// sibling screen.
export type BrowseFilters = {
  location: string;
  typeFilter: string | null;
  priceMax: string;
  verifiedOnly: boolean;
  sort: NonNullable<PropertyFilters['sort']>;
};

export const DEFAULT_BROWSE_FILTERS: BrowseFilters = {
  location: '',
  typeFilter: null,
  priceMax: '',
  verifiedOnly: false,
  sort: 'newest',
};

type BrowseFiltersContextValue = {
  filters: BrowseFilters;
  setFilters: (next: BrowseFilters) => void;
};

const BrowseFiltersContext = createContext<BrowseFiltersContextValue | null>(null);

export function BrowseFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_BROWSE_FILTERS);
  return (
    <BrowseFiltersContext.Provider value={{ filters, setFilters }}>{children}</BrowseFiltersContext.Provider>
  );
}

export function useBrowseFilters(): BrowseFiltersContextValue {
  const context = useContext(BrowseFiltersContext);
  if (!context) throw new Error('useBrowseFilters must be used within a BrowseFiltersProvider');
  return context;
}
