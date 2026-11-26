import * as Y from "yjs";
import type { Project } from "../models/project.js";
import type { Actor } from "../models/actor.js";
import type { Conversation } from "../models/conversation.js";
import type { AnyDialogueNode } from "../models/node.js";
import type { Connection } from "../models/connection.js";
import type { Variable } from "../models/variable.js";
import type { Item } from "../models/item.js";
import type { NarrativeDocument } from "../models/document.js";

/**
 * Initializes a Y.Doc structure matching the Freewrite specification from Section 7.2.
 */
export function initYDocFromProject(project: Project, existingDoc?: Y.Doc): Y.Doc {
  const doc = existingDoc || new Y.Doc();

  doc.transact(() => {
    // Project metadata map
    const projectMap = doc.getMap("project");
    projectMap.set("id", project.project.id);
    projectMap.set("name", project.project.name);
    projectMap.set("description", project.project.description);
    projectMap.set("author", project.project.author);
    projectMap.set("createdAt", project.project.createdAt);
    projectMap.set("updatedAt", project.project.updatedAt);

    // Document root metadata
    const rootMetaMap = doc.getMap("metadata");
    rootMetaMap.set("format", project.format);
    rootMetaMap.set("schemaVersion", project.schemaVersion);
    rootMetaMap.set("applicationVersion", project.metadata.applicationVersion);

    // Actors map
    const actorsMap = doc.getMap<Actor>("actors");
    actorsMap.clear();
    for (const actor of project.actors) {
      actorsMap.set(actor.id, actor);
    }

    // Variables map
    const varsMap = doc.getMap<Variable>("variables");
    varsMap.clear();
    for (const variable of project.variables) {
      varsMap.set(variable.id, variable);
    }

    // Items map
    const itemsMap = doc.getMap<Item>("items");
    itemsMap.clear();
    if (project.items) {
      for (const it of project.items) {
        itemsMap.set(it.id, it);
      }
    }

    // Documents map
    const docsMap = doc.getMap<NarrativeDocument>("documents");
    docsMap.clear();
    if (project.documents) {
      for (const d of project.documents) {
        docsMap.set(d.id, d);
      }
    }

    // Conversations map
    const convsMap = doc.getMap("conversations");
    convsMap.clear();

    for (const conv of project.conversations) {
      const convMap = new Y.Map();
      convMap.set("id", conv.id);
      convMap.set("externalId", conv.externalId ?? null);
      convMap.set("title", conv.title);
      convMap.set("description", conv.description);
      convMap.set("actorId", conv.actorId ?? null);
      convMap.set("conversantId", conv.conversantId ?? null);
      convMap.set("startNodeId", conv.startNodeId ?? null);
      convMap.set("priority", conv.priority || "Normal");
      convMap.set("fields", conv.fields || []);
      convMap.set("metadata", conv.metadata || {});

      // Nodes map inside conversation
      const nodesMap = new Y.Map<AnyDialogueNode>();
      for (const node of conv.nodes) {
        nodesMap.set(node.id, node);
      }
      convMap.set("nodes", nodesMap);

      // Connections map inside conversation
      const connsMap = new Y.Map<Connection>();
      for (const conn of conv.connections) {
        connsMap.set(conn.id, conn);
      }
      convMap.set("connections", connsMap);

      convsMap.set(conv.id, convMap);
    }
  });

  return doc;
}

/**
 * Extracts a complete Project data model from a shared Y.Doc.
 */
export function extractProjectFromYDoc(doc: Y.Doc): Project {
  const projectMap = doc.getMap("project");
  const rootMetaMap = doc.getMap("metadata");

  const projectId = (projectMap.get("id") as string) || "untitled-project";
  const name = (projectMap.get("name") as string) || "Untitled Project";
  const description = (projectMap.get("description") as string) || "";
  const author = (projectMap.get("author") as string) || "";
  const createdAt = (projectMap.get("createdAt") as string) || new Date().toISOString();
  const updatedAt = (projectMap.get("updatedAt") as string) || new Date().toISOString();

  const actorsMap = doc.getMap<Actor>("actors");
  const actors: Actor[] = [];
  actorsMap.forEach((actor) => {
    actors.push(actor);
  });

  const varsMap = doc.getMap<Variable>("variables");
  const variables: Variable[] = [];
  varsMap.forEach((variable) => {
    variables.push(variable);
  });

  const itemsMap = doc.getMap<Item>("items");
  const items: Item[] = [];
  if (itemsMap) {
    itemsMap.forEach((item) => {
      items.push(item);
    });
  }

  const docsMap = doc.getMap<NarrativeDocument>("documents");
  const documents: NarrativeDocument[] = [];
  if (docsMap) {
    docsMap.forEach((d) => {
      documents.push(d);
    });
  }

  const convsMap = doc.getMap("conversations");
  const conversations: Conversation[] = [];

  convsMap.forEach((convMapRaw) => {
    if (convMapRaw instanceof Y.Map) {
      const convMap = convMapRaw;
      const nodes: AnyDialogueNode[] = [];
      const connections: Connection[] = [];

      const nodesMap = convMap.get("nodes");
      if (nodesMap instanceof Y.Map) {
        nodesMap.forEach((node) => nodes.push(node as AnyDialogueNode));
      }

      const connsMap = convMap.get("connections");
      if (connsMap instanceof Y.Map) {
        connsMap.forEach((conn) => connections.push(conn as Connection));
      }

      conversations.push({
        id: convMap.get("id") as string,
        externalId: (convMap.get("externalId") as number) ?? null,
        title: (convMap.get("title") as string) || "Untitled Conversation",
        description: (convMap.get("description") as string) || "",
        actorId: (convMap.get("actorId") as string) ?? null,
        conversantId: (convMap.get("conversantId") as string) ?? null,
        priority: (convMap.get("priority") as any) || "Normal",
        startNodeId: (convMap.get("startNodeId") as string) ?? null,
        fields: (convMap.get("fields") as any) || [],
        metadata: (convMap.get("metadata") as Record<string, unknown>) || {},
        nodes,
        connections,
      });
    }
  });

  return {
    format: "freewrite",
    schemaVersion: "1.0.0",
    project: {
      id: projectId,
      name,
      description,
      author,
      createdAt,
      updatedAt,
    },
    actors,
    conversations,
    variables,
    items,
    locations: [],
    documents,
    metadata: {
      applicationVersion: (rootMetaMap.get("applicationVersion") as string) || "0.1.0",
      exportSettings: {},
    },
  };
}

/**
 * Syncs a single node directly into a shared Y.Doc.
 */
export function syncNodeToYDoc(
  doc: Y.Doc,
  conversationId: string,
  node: AnyDialogueNode
): void {
  doc.transact(() => {
    const convsMap = doc.getMap("conversations");
    const convMap = convsMap.get(conversationId);
    if (convMap instanceof Y.Map) {
      const nodesMap = convMap.get("nodes");
      if (nodesMap instanceof Y.Map) {
        nodesMap.set(node.id, node);
      }
    }
  });
}

/**
 * Removes a single node from a shared Y.Doc.
 */
export function removeNodeFromYDoc(
  doc: Y.Doc,
  conversationId: string,
  nodeId: string
): void {
  doc.transact(() => {
    const convsMap = doc.getMap("conversations");
    const convMap = convsMap.get(conversationId);
    if (convMap instanceof Y.Map) {
      const nodesMap = convMap.get("nodes");
      if (nodesMap instanceof Y.Map) {
        nodesMap.delete(nodeId);
      }
    }
  });
}

/**
 * Syncs a connection directly into a shared Y.Doc.
 */
export function syncConnectionToYDoc(
  doc: Y.Doc,
  conversationId: string,
  connection: Connection
): void {
  doc.transact(() => {
    const convsMap = doc.getMap("conversations");
    const convMap = convsMap.get(conversationId);
    if (convMap instanceof Y.Map) {
      const connsMap = convMap.get("connections");
      if (connsMap instanceof Y.Map) {
        connsMap.set(connection.id, connection);
      }
    }
  });
}

/**
 * Removes a connection from a shared Y.Doc.
 */
export function removeConnectionFromYDoc(
  doc: Y.Doc,
  conversationId: string,
  connectionId: string
): void {
  doc.transact(() => {
    const convsMap = doc.getMap("conversations");
    const convMap = convsMap.get(conversationId);
    if (convMap instanceof Y.Map) {
      const connsMap = convMap.get("connections");
      if (connsMap instanceof Y.Map) {
        connsMap.delete(connectionId);
      }
    }
  });
}

/**
 * Syncs a narrative document directly into a shared Y.Doc.
 */
export function syncDocumentToYDoc(
  doc: Y.Doc,
  narrativeDoc: NarrativeDocument
): void {
  doc.transact(() => {
    const docsMap = doc.getMap<NarrativeDocument>("documents");
    docsMap.set(narrativeDoc.id, narrativeDoc);
  });
}

/**
 * Removes a narrative document from a shared Y.Doc.
 */
export function removeDocumentFromYDoc(doc: Y.Doc, documentId: string): void {
  doc.transact(() => {
    const docsMap = doc.getMap<NarrativeDocument>("documents");
    docsMap.delete(documentId);
  });
}
