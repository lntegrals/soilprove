"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { DEMO_FIELD, ALT_FIELDS } from "./demo-data";
import {
  AgronomistReview,
  FieldInputs,
  FieldState,
  OutcomeData,
  SoilProfile,
  TrialPlan,
  WeatherProfile,
} from "./types";

const STORAGE_KEY = "soilprove.workspace.v1";

type WorkspaceState = {
  fields: Record<string, FieldState>;
  order: string[];
  activeId: string;
};

const DEFAULT_REVIEW: AgronomistReview = {
  status: "pending",
  reviewerName: "J. Reyes, CCA",
  reviewerLicense: "CCA #4413 — IA / IL / MO",
  rationale:
    "Field history fits the cohort. Comfortable with the recommendation on a trial strip first.",
};

function blankState(inputs: FieldInputs): FieldState {
  return {
    inputs,
    review: { ...DEFAULT_REVIEW },
    updatedAt: new Date().toISOString(),
  };
}

function buildInitialState(): WorkspaceState {
  const seedInputs = [DEMO_FIELD, ...ALT_FIELDS];
  const fields: Record<string, FieldState> = {};
  for (const i of seedInputs) fields[i.id] = blankState(i);
  return {
    fields,
    order: seedInputs.map((f) => f.id),
    activeId: DEMO_FIELD.id,
  };
}

// ---- vanilla store (works on both client and server-safe via SSR fallback) ----
let memoryState: WorkspaceState | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): WorkspaceState {
  if (typeof window === "undefined") return buildInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as WorkspaceState;
    // Defensive: ensure demo field exists.
    if (!parsed.fields[DEMO_FIELD.id]) {
      parsed.fields[DEMO_FIELD.id] = blankState(DEMO_FIELD);
      if (!parsed.order.includes(DEMO_FIELD.id)) parsed.order.unshift(DEMO_FIELD.id);
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

function getSnapshot(): WorkspaceState {
  if (memoryState === null) memoryState = loadFromStorage();
  return memoryState;
}

// Cached server-side snapshot: must return the same reference every call
// to satisfy useSyncExternalStore.
let _serverSnapshot: WorkspaceState | null = null;
function getServerSnapshot(): WorkspaceState {
  if (_serverSnapshot === null) _serverSnapshot = buildInitialState();
  return _serverSnapshot;
}

function persist() {
  if (memoryState && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      /* quota or private browsing — non-fatal */
    }
  }
}

function emit() {
  for (const l of listeners) l();
}

function update(mutator: (prev: WorkspaceState) => WorkspaceState) {
  const prev = getSnapshot();
  const next = mutator(prev);
  memoryState = next;
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Cross-tab sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      memoryState = loadFromStorage();
      emit();
    }
  });
}

// ---- public API ----
export function useWorkspace() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useActiveFieldId() {
  return useWorkspace().activeId;
}

export function useFieldState(id?: string): FieldState | undefined {
  const ws = useWorkspace();
  const fid = id ?? ws.activeId;
  return ws.fields[fid];
}

export function useFieldList(): FieldState[] {
  const ws = useWorkspace();
  return ws.order.map((id) => ws.fields[id]).filter(Boolean);
}

export const workspaceActions = {
  setActive(id: string) {
    update((p) =>
      p.fields[id] ? { ...p, activeId: id } : p
    );
  },
  patchInputs(id: string, patch: Partial<FieldInputs>) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      const next = {
        ...fs,
        inputs: { ...fs.inputs, ...patch },
        updatedAt: new Date().toISOString(),
      };
      return { ...p, fields: { ...p.fields, [id]: next } };
    });
  },
  setSoil(id: string, soil: SoilProfile | undefined) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: { ...fs, soil, updatedAt: new Date().toISOString() },
        },
      };
    });
  },
  setWeather(id: string, weather: WeatherProfile | undefined) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: { ...fs, weather, updatedAt: new Date().toISOString() },
        },
      };
    });
  },
  patchReview(id: string, patch: Partial<AgronomistReview>) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      const review = { ...(fs.review ?? DEFAULT_REVIEW), ...patch };
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: { ...fs, review, updatedAt: new Date().toISOString() },
        },
      };
    });
  },
  patchTrial(id: string, patch: Partial<TrialPlan>) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: {
            ...fs,
            trial: { ...(fs.trial ?? {}), ...patch },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
  patchOutcome(id: string, patch: Partial<OutcomeData>) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: {
            ...fs,
            outcome: { ...(fs.outcome ?? {}), ...patch },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
  resetField(id: string) {
    update((p) => {
      const fs = p.fields[id];
      if (!fs) return p;
      return {
        ...p,
        fields: {
          ...p.fields,
          [id]: { ...blankState(fs.inputs), updatedAt: new Date().toISOString() },
        },
      };
    });
  },
  resetAll() {
    update(() => buildInitialState());
  },
};

// Async data fetch helpers (client only).
export function useSoilFetcher(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fs = getSnapshot().fields[id];
      if (!fs) return;
      const { latitude, longitude } = fs.inputs.location;
      const res = await fetch(
        `/api/soil?lat=${latitude}&lon=${longitude}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Soil fetch failed (${res.status})`);
      const data = (await res.json()) as SoilProfile;
      workspaceActions.setSoil(id, data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Soil fetch failed");
    } finally {
      setLoading(false);
    }
  }, [id]);
  return { loading, error, refresh };
}

export function useWeatherFetcher(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fs = getSnapshot().fields[id];
      if (!fs) return;
      const { latitude, longitude } = fs.inputs.location;
      const res = await fetch(
        `/api/weather?lat=${latitude}&lon=${longitude}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
      const data = (await res.json()) as WeatherProfile;
      workspaceActions.setWeather(id, data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Weather fetch failed");
    } finally {
      setLoading(false);
    }
  }, [id]);
  return { loading, error, refresh };
}

// Auto-fetch helper: load soil + weather once if missing.
export function useEnsureIntelligence(id: string) {
  const fs = useFieldState(id);
  const soilFetcher = useSoilFetcher(id);
  const weatherFetcher = useWeatherFetcher(id);
  useEffect(() => {
    if (fs && !fs.soil && !soilFetcher.loading) soilFetcher.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!fs?.soil]);
  useEffect(() => {
    if (fs && !fs.weather && !weatherFetcher.loading) weatherFetcher.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!fs?.weather]);
  return { soilFetcher, weatherFetcher };
}
