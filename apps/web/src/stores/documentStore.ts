import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  DocumentCategory,
  DocumentSection,
  DocumentSectionType,
  NarrativeDocument,
} from "@freewrite/core";
import { useProjectStore } from "./projectStore";
import { collaborationManager } from "../features/collaboration/collaborationManager";

export type WorkspaceViewMode = "canvas" | "document" | "location";

interface DocumentStoreState {
  activeDocumentId: string | null;
  activeSectionId: string | null;
  viewMode: WorkspaceViewMode;

  setViewMode: (mode: WorkspaceViewMode) => void;
  openDocument: (id: string) => void;
  closeDocument: () => void;
  setActiveSectionId: (id: string | null) => void;

  createDocument: (title: string, category?: DocumentCategory) => string;
  updateDocument: (id: string, patch: Partial<NarrativeDocument>) => void;
  deleteDocument: (id: string) => void;

  addSection: (
    docId: string,
    opts?: {
      title?: string;
      level?: number;
      type?: DocumentSectionType;
      content?: string;
      afterSectionId?: string;
    }
  ) => string;
  updateSection: (
    docId: string,
    sectionId: string,
    patch: Partial<DocumentSection>
  ) => void;
  removeSection: (docId: string, sectionId: string) => void;
  moveSection: (docId: string, sectionId: string, direction: "up" | "down") => void;
  toggleSectionCollapse: (docId: string, sectionId: string) => void;
  collapseAllSections: (docId: string, collapsed: boolean) => void;
}

function getNextExternalDocId(docs: NarrativeDocument[]): number {
  const maxId = docs.reduce((max, d) => Math.max(max, d.externalId ?? 0), 0);
  return maxId + 1;
}

function getDocFromProject(docId: string): NarrativeDocument | undefined {
  const project = useProjectStore.getState().project;
  return project?.documents?.find((d) => d.id === docId);
}

export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  activeDocumentId: null,
  activeSectionId: null,
  viewMode: "canvas",

  setViewMode: (mode) => set({ viewMode: mode }),

  openDocument: (id) => {
    const doc = getDocFromProject(id);
    set({
      activeDocumentId: id,
      activeSectionId: doc?.sections[0]?.id ?? null,
      viewMode: "document",
    });
  },

  closeDocument: () =>
    set({ activeDocumentId: null, activeSectionId: null, viewMode: "canvas" }),

  setActiveSectionId: (id) => set({ activeSectionId: id }),

  createDocument: (title, category = "gdd") => {
    const project = useProjectStore.getState().project;
    const now = new Date().toISOString();
    const id = uuidv4();
    const firstSectionId = uuidv4();

    const defaultContent =
      category === "screenplay"
        ? "NPC: Welcome, traveler. What brings you here?\n(The guard leans on his halberd.)\nPLAYER: I'm looking for the blacksmith."
        : "Write your narrative notes, lore, or design specifications here.\n\nUse `@` or **Insert Reference** to link Actors, Conversations, Nodes, Quests, or Variables.";

    const newDoc: NarrativeDocument = {
      id,
      externalId: getNextExternalDocId(project?.documents || []),
      title: title.trim() || "Untitled Document",
      category,
      description: "",
      tags: [],
      sections: [
        {
          id: firstSectionId,
          title: category === "screenplay" ? "Scene 1" : "Overview",
          level: 1,
          type: category === "screenplay" ? "screenplay" : "text",
          content: defaultContent,
          collapsed: false,
          linkedEntityIds: [],
          metadata: {},
        },
      ],
      fields: [],
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };

    useProjectStore.getState().addDocument(newDoc);
    collaborationManager.syncDocument(newDoc);
    set({
      activeDocumentId: id,
      activeSectionId: firstSectionId,
      viewMode: "document",
    });
    return id;
  },

  updateDocument: (id, patch) => {
    useProjectStore.getState().updateDocument(id, patch);
    const updated = getDocFromProject(id);
    if (updated) {
      collaborationManager.syncDocument(updated);
    }
  },

  deleteDocument: (id) => {
    useProjectStore.getState().removeDocument(id);
    collaborationManager.removeDocument(id);
    if (get().activeDocumentId === id) {
      set({ activeDocumentId: null, activeSectionId: null, viewMode: "canvas" });
    }
  },

  addSection: (docId, opts = {}) => {
    const doc = getDocFromProject(docId);
    if (!doc) return "";

    const newSectionId = uuidv4();
    const newSection: DocumentSection = {
      id: newSectionId,
      title: opts.title ?? "New Section",
      level: opts.level ?? 1,
      type: opts.type ?? "text",
      content:
        opts.content ??
        (opts.type === "todo"
          ? "- [ ] First task\n- [ ] Second task"
          : opts.type === "table"
          ? "| Column 1 | Column 2 | Notes |\n| --- | --- | --- |\n| Value A | Value B | ... |"
          : opts.type === "screenplay"
          ? "ACTOR: Line of dialogue...\nPLAYER: Response choice..."
          : ""),
      collapsed: false,
      linkedEntityIds: [],
      metadata: {},
    };

    const nextSections = [...doc.sections];
    if (opts.afterSectionId) {
      const idx = nextSections.findIndex((s) => s.id === opts.afterSectionId);
      if (idx !== -1) {
        nextSections.splice(idx + 1, 0, newSection);
      } else {
        nextSections.push(newSection);
      }
    } else {
      nextSections.push(newSection);
    }

    get().updateDocument(docId, { sections: nextSections });
    set({ activeSectionId: newSectionId });
    return newSectionId;
  },

  updateSection: (docId, sectionId, patch) => {
    const doc = getDocFromProject(docId);
    if (!doc) return;
    const nextSections = doc.sections.map((s) =>
      s.id === sectionId ? { ...s, ...patch } : s
    );
    get().updateDocument(docId, { sections: nextSections });
  },

  removeSection: (docId, sectionId) => {
    const doc = getDocFromProject(docId);
    if (!doc) return;
    const nextSections = doc.sections.filter((s) => s.id !== sectionId);
    get().updateDocument(docId, { sections: nextSections });
    if (get().activeSectionId === sectionId) {
      set({ activeSectionId: nextSections[0]?.id ?? null });
    }
  },

  moveSection: (docId, sectionId, direction) => {
    const doc = getDocFromProject(docId);
    if (!doc) return;
    const idx = doc.sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= doc.sections.length) return;
    const nextSections = [...doc.sections];
    const [moved] = nextSections.splice(idx, 1);
    nextSections.splice(targetIdx, 0, moved);
    get().updateDocument(docId, { sections: nextSections });
  },

  toggleSectionCollapse: (docId, sectionId) => {
    const doc = getDocFromProject(docId);
    if (!doc) return;
    const nextSections = doc.sections.map((s) =>
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    );
    get().updateDocument(docId, { sections: nextSections });
  },

  collapseAllSections: (docId, collapsed) => {
    const doc = getDocFromProject(docId);
    if (!doc) return;
    const nextSections = doc.sections.map((s) => ({ ...s, collapsed }));
    get().updateDocument(docId, { sections: nextSections });
  },
}));
