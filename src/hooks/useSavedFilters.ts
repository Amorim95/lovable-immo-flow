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
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(storageKey);
    setHasSavedFilter(!!saved);
    setSavedSnapshot(saved);
  }, [storageKey, user?.id]);

  const saveFilters = useCallback((filters: SavedFilters) => {
    const json = JSON.stringify(filters);
    localStorage.setItem(storageKey, json);
    setHasSavedFilter(true);
    setSavedSnapshot(json);
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
    setSavedSnapshot(null);
  }, [storageKey]);

  const isMatchingSaved = useCallback((currentFilters: SavedFilters): boolean => {
    if (!savedSnapshot) return false;
    return JSON.stringify(currentFilters) === savedSnapshot;
  }, [savedSnapshot]);

  return { saveFilters, loadFilters, clearSavedFilters, hasSavedFilter, isMatchingSaved };
}
