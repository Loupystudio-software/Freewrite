import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  Location,
  LocationElement,
  LocationElementType,
} from "@freewrite/core";
import { useProjectStore } from "./projectStore";
import { useDocumentStore } from "./documentStore";
import { collaborationManager } from "../features/collaboration/collaborationManager";

export type LocationTool =
  | "select"
  | "zone_rect"
  | "zone_circle"
  | "zone_polygon"
  | "path"
  | "spot"
  | "link"
  | "image";

interface LocationStoreState {
  activeLocationId: string | null;
  selectedElementId: string | null;
  activeTool: LocationTool;

  setActiveTool: (tool: LocationTool) => void;
  setSelectedElementId: (id: string | null) => void;
  openLocation: (id: string) => void;
  closeLocation: () => void;

  createLocation: (name: string, parentId?: string | null) => string;
  updateLocation: (id: string, patch: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  addElement: (
    locationId: string,
    opts: Partial<LocationElement> & { type: LocationElementType }
  ) => string;
  updateElement: (
    locationId: string,
    elementId: string,
    patch: Partial<LocationElement>
  ) => void;
  removeElement: (locationId: string, elementId: string) => void;
  reorderElement: (
    locationId: string,
    elementId: string,
    direction: "up" | "down"
  ) => void;
  toggleElementVisibility: (locationId: string, elementId: string) => void;
  toggleElementLock: (locationId: string, elementId: string) => void;
}

function getLocationFromProject(id: string): Location | undefined {
  return useProjectStore
    .getState()
    .project?.locations?.find((l) => l.id === id);
}

function getNextExternalLocationId(locs: Location[]): number {
  return locs.reduce((max, l) => Math.max(max, l.externalId ?? 0), 0) + 1;
}

export const useLocationStore = create<LocationStoreState>((set, get) => ({
  activeLocationId: null,
  selectedElementId: null,
  activeTool: "select",

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),

  openLocation: (id) => {
    useDocumentStore.getState().setViewMode("location");
    set({ activeLocationId: id, selectedElementId: null });
  },

  closeLocation: () => {
    useDocumentStore.getState().setViewMode("canvas");
    set({ activeLocationId: null, selectedElementId: null });
  },

  createLocation: (name, parentId = null) => {
    const project = useProjectStore.getState().project;
    const id = uuidv4();
    const newLoc: Location = {
      id,
      externalId: getNextExternalLocationId(project?.locations || []),
      name: name.trim() || "Untitled Location",
      parentId,
      description: "",
      color: "#60a5fa",
      backgroundColor: "#14161b",
      elements: [],
      fields: [],
      metadata: {},
    };
    useProjectStore.getState().addLocation(newLoc);
    collaborationManager.syncLocation(newLoc);
    useDocumentStore.getState().setViewMode("location");
    set({ activeLocationId: id, selectedElementId: null, activeTool: "select" });
    return id;
  },

  updateLocation: (id, patch) => {
    useProjectStore.getState().updateLocation(id, patch);
    const updated = getLocationFromProject(id);
    if (updated) collaborationManager.syncLocation(updated);
  },

  deleteLocation: (id) => {
    useProjectStore.getState().removeLocation(id);
    collaborationManager.removeLocation(id);
    if (get().activeLocationId === id) {
      useDocumentStore.getState().setViewMode("canvas");
      set({ activeLocationId: null, selectedElementId: null });
    }
  },

  addElement: (locationId, opts) => {
    const loc = getLocationFromProject(locationId);
    if (!loc) return "";
    const id = uuidv4();
    const defaultNames: Record<LocationElementType, string> = {
      zone_rect: "Zone",
      zone_circle: "Circular Zone",
      zone_polygon: "Region Polygon",
      path: "Path",
      spot: "Spot",
      link: "Location Link",
      image: "Map Image",
    };
    const defaultColors: Record<LocationElementType, string> = {
      zone_rect: "#3b82f6",
      zone_circle: "#10b981",
      zone_polygon: "#8b5cf6",
      path: "#f59e0b",
      spot: "#ef4444",
      link: "#06b6d4",
      image: "#64748b",
    };
    const maxZ = loc.elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    const newEl: LocationElement = {
      id,
      type: opts.type,
      name: opts.name ?? defaultNames[opts.type],
      description: opts.description ?? "",
      x: opts.x ?? 100,
      y: opts.y ?? 100,
      width: opts.width ?? 200,
      height: opts.height ?? 140,
      points: opts.points ?? [],
      color: opts.color ?? defaultColors[opts.type],
      opacity: opts.opacity ?? (opts.type === "image" ? 1 : 0.35),
      visible: opts.visible ?? true,
      locked: opts.locked ?? false,
      zIndex: opts.zIndex ?? maxZ + 1,
      imageUrl: opts.imageUrl ?? "",
      linkedEntityType: opts.linkedEntityType ?? "none",
      linkedEntityId: opts.linkedEntityId ?? null,
      fields: opts.fields ?? [],
      metadata: opts.metadata ?? {},
    };
    get().updateLocation(locationId, { elements: [...loc.elements, newEl] });
    set({ selectedElementId: id });
    return id;
  },

  updateElement: (locationId, elementId, patch) => {
    const loc = getLocationFromProject(locationId);
    if (!loc) return;
    const nextElements = loc.elements.map((el) =>
      el.id === elementId ? { ...el, ...patch } : el
    );
    get().updateLocation(locationId, { elements: nextElements });
  },

  removeElement: (locationId, elementId) => {
    const loc = getLocationFromProject(locationId);
    if (!loc) return;
    const nextElements = loc.elements.filter((el) => el.id !== elementId);
    get().updateLocation(locationId, { elements: nextElements });
    if (get().selectedElementId === elementId) {
      set({ selectedElementId: null });
    }
  },

  reorderElement: (locationId, elementId, direction) => {
    const loc = getLocationFromProject(locationId);
    if (!loc) return;
    const idx = loc.elements.findIndex((e) => e.id === elementId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= loc.elements.length) return;
    const next = [...loc.elements];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    const reindexed = next.map((el, i) => ({ ...el, zIndex: i }));
    get().updateLocation(locationId, { elements: reindexed });
  },

  toggleElementVisibility: (locationId, elementId) => {
    const loc = getLocationFromProject(locationId);
    const el = loc?.elements.find((e) => e.id === elementId);
    if (!el) return;
    get().updateElement(locationId, elementId, { visible: !el.visible });
  },

  toggleElementLock: (locationId, elementId) => {
    const loc = getLocationFromProject(locationId);
    const el = loc?.elements.find((e) => e.id === elementId);
    if (!el) return;
    get().updateElement(locationId, elementId, { locked: !el.locked });
  },
}));
