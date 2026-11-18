import type { Project } from "../models/project.js";

export interface ValidationIssue {
  code: string;
  message: string;
  entityId?: string;
  entityType?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateProject(project: Project): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Project metadata checks
  if (!project.project.id) {
    errors.push({ code: "MISSING_PROJECT_ID", message: "Project is missing an ID." });
  }
  if (!project.project.name || project.project.name.trim() === "") {
    errors.push({ code: "EMPTY_PROJECT_NAME", message: "Project name must not be empty.", entityType: "project" });
  }

  // Actor checks
  const actorIds = new Set<string>();
  for (const actor of project.actors) {
    if (actorIds.has(actor.id)) {
      errors.push({ code: "DUPLICATE_ACTOR_ID", message: `Duplicate actor ID: ${actor.id}`, entityId: actor.id, entityType: "actor" });
    }
    actorIds.add(actor.id);
    if (!actor.name || actor.name.trim() === "") {
      warnings.push({ code: "EMPTY_ACTOR_NAME", message: `Actor ${actor.id} has no name.`, entityId: actor.id, entityType: "actor" });
    }
  }

  // Conversation checks
  const convIds = new Set<string>();
  for (const conv of project.conversations) {
    if (convIds.has(conv.id)) {
      errors.push({ code: "DUPLICATE_CONVERSATION_ID", message: `Duplicate conversation ID: ${conv.id}`, entityId: conv.id, entityType: "conversation" });
    }
    convIds.add(conv.id);

    const nodeIds = new Set<string>();
    const startNodes = conv.nodes.filter((n) => n.type === "start");

    if (conv.nodes.length > 0 && startNodes.length === 0) {
      warnings.push({
        code: "CONVERSATION_NO_START_NODE",
        message: `Conversation "${conv.title}" has no Start node.`,
        entityId: conv.id,
        entityType: "conversation",
      });
    } else if (startNodes.length > 1) {
      errors.push({
        code: "CONVERSATION_MULTIPLE_START_NODES",
        message: `Conversation "${conv.title}" has ${startNodes.length} Start nodes. Only one Start node is allowed.`,
        entityId: conv.id,
        entityType: "conversation",
      });
    }

    for (const node of conv.nodes) {
      if (nodeIds.has(node.id)) {
        errors.push({
          code: "DUPLICATE_NODE_ID",
          message: `Duplicate node ID ${node.id} in conversation "${conv.title}"`,
          entityId: node.id,
          entityType: "node",
        });
      }
      nodeIds.add(node.id);

      // Node specific content checks
      if (node.type === "dialogue") {
        if (!node.dialogueText || node.dialogueText.trim() === "") {
          warnings.push({
            code: "EMPTY_DIALOGUE_TEXT",
            message: `Dialogue node ${node.id} has empty dialogue text in "${conv.title}".`,
            entityId: node.id,
            entityType: "node",
          });
        }
      } else if (node.type === "player_response") {
        if (!node.responseText || node.responseText.trim() === "") {
          warnings.push({
            code: "EMPTY_RESPONSE_TEXT",
            message: `Player response node ${node.id} has empty response text in "${conv.title}".`,
            entityId: node.id,
            entityType: "node",
          });
        }
      }
    }

    const connIds = new Set<string>();
    const adjacency = new Map<string, string[]>();

    for (const conn of conv.connections) {
      if (connIds.has(conn.id)) {
        errors.push({
          code: "DUPLICATE_CONNECTION_ID",
          message: `Duplicate connection ID ${conn.id} in conversation "${conv.title}"`,
          entityId: conn.id,
          entityType: "connection",
        });
      }
      connIds.add(conn.id);

      if (!nodeIds.has(conn.sourceNodeId)) {
        errors.push({
          code: "BROKEN_CONNECTION_SOURCE",
          message: `Connection ${conn.id} references missing source node ${conn.sourceNodeId}`,
          entityId: conn.id,
          entityType: "connection",
        });
      }
      if (!nodeIds.has(conn.targetNodeId)) {
        errors.push({
          code: "BROKEN_CONNECTION_TARGET",
          message: `Connection ${conn.id} references missing target node ${conn.targetNodeId}`,
          entityId: conn.id,
          entityType: "connection",
        });
      }

      if (!adjacency.has(conn.sourceNodeId)) {
        adjacency.set(conn.sourceNodeId, []);
      }
      adjacency.get(conn.sourceNodeId)!.push(conn.targetNodeId);
    }

    if (conv.nodes.length > 0 && !conv.startNodeId && startNodes.length === 0) {
      warnings.push({
        code: "MISSING_START_NODE",
        message: `Conversation "${conv.title}" has nodes but no start node set.`,
        entityId: conv.id,
        entityType: "conversation",
      });
    }

    // Reachability analysis from Start node
    const effectiveStartId = conv.startNodeId || startNodes[0]?.id;
    if (effectiveStartId && nodeIds.has(effectiveStartId)) {
      const visited = new Set<string>();
      const queue: string[] = [effectiveStartId];
      visited.add(effectiveStartId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adjacency.get(current) || [];
        for (const next of neighbors) {
          if (!visited.has(next) && nodeIds.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }

      for (const node of conv.nodes) {
        // Comments are non-executable design annotations and start node is root
        if (node.type !== "comment" && node.id !== effectiveStartId && !visited.has(node.id)) {
          warnings.push({
            code: "UNREACHABLE_NODE",
            message: `Node ${node.id} (${node.type}) is not reachable from the Start node in "${conv.title}".`,
            entityId: node.id,
            entityType: "node",
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
