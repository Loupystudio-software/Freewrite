import { create } from "zustand";
import {
  createEmptyProject,
  serialize,
  deserialize,
  validateProject,
  type Project,
  type Conversation,
  type Variable,
  type Actor,
  type Item,
  type NarrativeDocument,
  type ValidationResult,
} from "@freewrite/core";
import {
  saveProjectFile,
  saveProjectFileAs,
  downloadProjectFile,
  hasFSA,
} from "../features/storage/fileSystemAccess";
import { cacheProject } from "../features/storage/indexedDbCache";

export type SaveStatus = "saved" | "saving" | "unsaved" | "failed" | "none";

interface ProjectState {
  project: Project | null;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  fileHandle: FileSystemFileHandle | null;
  validationResult: ValidationResult | null;
  migrationWarnings: string[];

  createProject: (name: string, author?: string) => void;
  loadProject: (raw: string) => void;
  updateProjectMeta: (patch: Partial<Project["project"]>) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, patch: Partial<Variable>) => void;
  removeVariable: (id: string) => void;
  addActor: (actor: Actor) => void;
  updateActor: (id: string, patch: Partial<Actor>) => void;
  removeActor: (id: string) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  addDocument: (doc: NarrativeDocument) => void;
  updateDocument: (id: string, patch: Partial<NarrativeDocument>) => void;
  removeDocument: (id: string) => void;
  markDirty: () => void;
  saveToHandle: () => Promise<void>;
  saveAs: () => Promise<void>;
  downloadProject: () => void;
  setFileHandle: (handle: FileSystemFileHandle) => void;
  revalidate: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  isDirty: false,
  saveStatus: "none",
  lastSaved: null,
  fileHandle: null,
  validationResult: null,
  migrationWarnings: [],

  createProject: (name, author = "") => {
    const project = createEmptyProject(name, author);
    const validationResult = validateProject(project);
    const content = serialize(project);
    cacheProject(project.project.id, content).catch(console.error);
    set({
      project,
      isDirty: false,
      saveStatus: "unsaved",
      lastSaved: null,
      fileHandle: null,
      validationResult,
      migrationWarnings: [],
    });
  },

  loadProject: (raw) => {
    try {
      const { project, migrationWarnings } = deserialize(raw);
      const validationResult = validateProject(project);
      set({
        project,
        isDirty: false,
        saveStatus: "saved",
        lastSaved: new Date(),
        fileHandle: null,
        validationResult,
        migrationWarnings,
      });
    } catch (e) {
      set({ saveStatus: "failed" });
      throw e;
    }
  },

  updateProjectMeta: (patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      project: { ...project.project, ...patch },
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  addConversation: (conversation) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      conversations: [...project.conversations, conversation],
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  updateConversation: (id, patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      conversations: project.conversations.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  removeConversation: (id) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      conversations: project.conversations.filter((c) => c.id !== id),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  addVariable: (variable) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      variables: [...project.variables, variable],
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  updateVariable: (id, patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      variables: project.variables.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  removeVariable: (id) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      variables: project.variables.filter((v) => v.id !== id),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  addActor: (actor) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      actors: [...project.actors, actor],
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  updateActor: (id, patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      actors: project.actors.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  removeActor: (id) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      actors: project.actors.filter((a) => a.id !== id),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  addItem: (item) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      items: [...(project.items || []), item],
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  updateItem: (id, patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      items: (project.items || []).map((it) =>
        it.id === id ? { ...it, ...patch } : it
      ),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  removeItem: (id) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      items: (project.items || []).filter((it) => it.id !== id),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  addDocument: (doc) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      documents: [...(project.documents || []), doc],
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  updateDocument: (id, patch) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      documents: (project.documents || []).map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
      ),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  removeDocument: (id) => {
    const { project } = get();
    if (!project) return;
    const updated: Project = {
      ...project,
      documents: (project.documents || []).filter((d) => d.id !== id),
    };
    const validationResult = validateProject(updated);
    set({ project: updated, isDirty: true, saveStatus: "unsaved", validationResult });
  },

  markDirty: () => set({ isDirty: true, saveStatus: "unsaved" }),

  saveToHandle: async () => {
    const { project, fileHandle } = get();
    if (!project) return;
    set({ saveStatus: "saving" });
    try {
      const content = serialize(project);
      if (fileHandle) {
        await saveProjectFile(fileHandle, content);
      } else {
        const handle = await saveProjectFileAs(content, `${project.project.name}.json`);
        if (handle) {
          await cacheProject(project.project.id, content);
          set({ fileHandle: handle, saveStatus: "saved", lastSaved: new Date(), isDirty: false });
          return;
        }
        set({ saveStatus: "unsaved" });
        return;
      }
      await cacheProject(project.project.id, content);
      set({ saveStatus: "saved", lastSaved: new Date(), isDirty: false });
    } catch (e) {
      set({ saveStatus: "failed" });
      throw e;
    }
  },

  saveAs: async () => {
    const { project } = get();
    if (!project) return;
    set({ saveStatus: "saving" });
    try {
      const content = serialize(project);
      if (hasFSA()) {
        const handle = await saveProjectFileAs(content, `${project.project.name}.json`);
        if (handle) {
          await cacheProject(project.project.id, content);
          set({ fileHandle: handle, saveStatus: "saved", lastSaved: new Date(), isDirty: false });
        } else {
          set({ saveStatus: "unsaved" });
        }
      } else {
        downloadProjectFile(content, `${project.project.name}.json`);
        set({ saveStatus: "saved", lastSaved: new Date(), isDirty: false });
      }
    } catch (e) {
      set({ saveStatus: "failed" });
      throw e;
    }
  },

  downloadProject: () => {
    const { project } = get();
    if (!project) return;
    const content = serialize(project);
    downloadProjectFile(content, `${project.project.name}.json`);
  },

  setFileHandle: (handle) => set({ fileHandle: handle }),

  revalidate: () => {
    const { project } = get();
    if (!project) return;
    set({ validationResult: validateProject(project) });
  },
}));
