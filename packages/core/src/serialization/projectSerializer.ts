import { v4 as uuidv4 } from "uuid";
import { ProjectSchema } from "../models/project.js";
import type { Project } from "../models/project.js";

export const APP_VERSION = "0.1.0";
export const SCHEMA_VERSION = "1.0.0";
export const SUPPORTED_SCHEMA_VERSIONS = ["1.0.0"];

export function createEmptyProject(name: string, author: string = ""): Project {
  const now = new Date().toISOString();
  return {
    format: "freewrite",
    schemaVersion: "1.0.0",
    project: {
      id: uuidv4(),
      name: name.trim() || "Untitled Project",
      description: "",
      author: author.trim(),
      createdAt: now,
      updatedAt: now,
    },
    actors: [],
    conversations: [],
    variables: [],
    items: [],
    locations: [],
    documents: [],
    metadata: {
      applicationVersion: APP_VERSION,
      exportSettings: {},
    },
  };
}

export function serialize(project: Project): string {
  const updated: Project = {
    ...project,
    project: {
      ...project.project,
      updatedAt: new Date().toISOString(),
    },
  };
  return JSON.stringify(updated, null, 2);
}

export interface DeserializeResult {
  project: Project;
  migrationWarnings: string[];
}

export function deserialize(raw: string): DeserializeResult {
  const migrationWarnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse project file: ${(e as Error).message}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Project file must be a JSON object.");
  }

  const obj = parsed as Record<string, unknown>;

  if (obj["format"] !== "freewrite") {
    throw new Error(`Unsupported project format: "${String(obj["format"])}". Expected "freewrite".`);
  }

  if (!SUPPORTED_SCHEMA_VERSIONS.includes(String(obj["schemaVersion"]))) {
    migrationWarnings.push(
      `Unknown schema version "${String(obj["schemaVersion"])}". Attempting to load with schema ${SCHEMA_VERSION}. Some data may be lost.`
    );
  }

  const result = ProjectSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Project validation failed:\n${issues}`);
  }

  return { project: result.data, migrationWarnings };
}
