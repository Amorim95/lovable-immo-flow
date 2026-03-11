import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilterOption } from "@/components/DateFilter";

export interface SavedFilters {
  dateFilter: DateFilterOption;
  customDateRange?: { from: string; to: string };
  selectedUserId: string | null;
  selectedTeamId: string | null;
  selectedTagIds: string[];
  selectedStageKey: string | null;
  selectedStageNames?: string[];
}

const STORAGE_KEY_PREFIX = "crm_saved_filters_";

export function useSavedFilters(page: string = "leads") {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${page}_${user?.id || "anonymous"}`;

  const [hasSavedFilter, setHasSavedFilter] = useState(false);

  // Check if saved filter exists
  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(storageKey);
    setHasSavedFilter(!!saved);
  }, [storageKey, user?.id]);

  const saveFilters = useCallback((filters: SavedFilters) => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
    setHasSavedFilter(true);
  }, [storageKey]);

  const loadFilters = useCallback((): SavedFilters | null => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as SavedFilters;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearSavedFilters = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSavedFilter(false);
  }, [storageKey]);

  return { saveFilters, loadFilters, clearSavedFilters, hasSavedFilter };
}
