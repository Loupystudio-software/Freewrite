import { XMLParser } from "fast-xml-parser";
import { v4 as uuidv4 } from "uuid";
import type { Project } from "../../models/project.js";
import type { Actor } from "../../models/actor.js";
import type { Variable } from "../../models/variable.js";
import type { Conversation } from "../../models/conversation.js";
import type { AnyDialogueNode } from "../../models/node.js";
import type { Connection } from "../../models/connection.js";

export interface ImportXMLResult {
  project: Project;
  warnings: string[];
}

export function importProjectFromChatMapperXML(xmlText: string): ImportXMLResult {
  const warnings: string[] = [];
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => {
      return ["Actor", "Variable", "Conversation", "DialogEntry", "Link", "Field"].includes(name);
    },
  });

  const parsed = parser.parse(xmlText);
  const root = parsed.ChatMapperProject;
  if (!root) {
    throw new Error("Invalid Chat Mapper XML: Missing <ChatMapperProject> root element.");
  }

  const projectName = root.Title || "Imported Chat Mapper Project";
  const projectAuthor = root.Author || "";
  const projectDesc = root.Description || "";

  const actors: Actor[] = [];
  const actorExternalMap = new Map<number, string>(); // extId -> internal uuid

  const rawActors = root.Actors?.Actor || [];
  for (const a of rawActors) {
    const extId = parseInt(a["@_ID"]);
    const internalId = uuidv4();
    if (!isNaN(extId)) {
      actorExternalMap.set(extId, internalId);
    }

    let isPlayer = false;
    let desc = "";

    const fields = a.Fields?.Field || [];
    for (const f of fields) {
      if (f["@_Name"] === "IsPlayer") {
        isPlayer = String(f["#text"]).toLowerCase() === "true";
      } else if (f["@_Name"] === "Description") {
        desc = String(f["#text"] || "");
      }
    }

    actors.push({
      id: internalId,
      externalId: !isNaN(extId) ? extId : null,
      name: a["@_Name"] || `Actor_${extId}`,
      description: desc,
      isPlayer,
      pictures: [],
      portrait: null,
      color: isPlayer ? "#10b981" : "#3b82f6",
      fields: [],
      metadata: {},
    });
  }

  const variables: Variable[] = [];
  const rawVars = root.Variables?.Variable || [];
  for (const v of rawVars) {
    const extId = parseInt(v["@_ID"]);
    const rawType = (v["@_Type"] || "").toLowerCase();
    const rawDefault = v["@_Default"] !== undefined ? v["@_Default"] : "";
    const name = String(v["#text"] || `Variable_${extId}`);

    let varType: "boolean" | "number" | "string" = "string";
    let initialValue: boolean | number | string = rawDefault;

    if (rawType === "boolean") {
      varType = "boolean";
      initialValue = String(rawDefault).toLowerCase() === "true";
    } else if (rawType === "number") {
      varType = "number";
      initialValue = isNaN(Number(rawDefault)) ? 0 : Number(rawDefault);
    }

    variables.push({
      id: uuidv4(),
      externalId: !isNaN(extId) ? extId : null,
      name,
      type: varType,
      initialValue,
      description: "",
    });
  }

  const conversations: Conversation[] = [];
  const rawConvs = root.Conversations?.Conversation || [];

  for (const c of rawConvs) {
    const extConvId = parseInt(c["@_ID"]);
    const convId = uuidv4();
    const convTitle = c["@_Title"] || `Conversation ${extConvId}`;

    const conv: Conversation = {
      id: convId,
      externalId: !isNaN(extConvId) ? extConvId : null,
      title: convTitle,
      description: "",
      actorId: null,
      conversantId: null,
      priority: "Normal",
      startNodeId: null,
      nodes: [],
      connections: [],
      fields: [],
      metadata: {},
    };

    const nodeEntryMap = new Map<number, string>(); // entryId -> internal uuid
    interface LinkRef {
      sourceEntryId: number;
      targetEntryId: number;
    }
    const convLinks: LinkRef[] = [];

    const rawEntries = c.DialogEntries?.DialogEntry || [];
    for (const entry of rawEntries) {
      const entryId = parseInt(entry["@_ID"]);
      if (isNaN(entryId)) continue;

      const internalNodeId = uuidv4();
      nodeEntryMap.set(entryId, internalNodeId);

      const isRoot = entry["@_IsRoot"] === "true" || entryId === 0;
      const text = entry.Text !== undefined ? String(entry.Text) : "";
      const conditions = entry.ConditionsString !== undefined ? String(entry.ConditionsString) : "";
      const script = entry.UserScript !== undefined ? String(entry.UserScript) : "";

      let menuText = "";
      let sequence = "";
      let x = 100;
      let y = 100 + entryId * 120;

      const fields = entry.Fields?.Field || [];
      for (const f of fields) {
        const fName = f["@_Name"];
        const fVal = String(f["#text"] || "");
        if (fName === "Menu Text" || fName === "MenuText") {
          menuText = fVal;
        } else if (fName === "Sequence") {
          sequence = fVal;
        } else if (fName === "canvasRect" && fVal.includes(";")) {
          const parts = fVal.split(";").map((p) => parseFloat(p));
          if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            x = Math.round(parts[0]);
            y = Math.round(parts[1]);
          }
        }
      }

      // Collect links
      const links = entry.Links?.Link || [];
      for (const l of links) {
        const destId = parseInt(l["@_DestinationDialogEntryID"]);
        if (!isNaN(destId)) {
          convLinks.push({ sourceEntryId: entryId, targetEntryId: destId });
        }
      }

      if (isRoot) {
        const startNode: AnyDialogueNode = {
          id: internalNodeId,
          externalId: 0,
          type: "start",
          label: text === "START" ? "Start" : text,
          position: { x, y },
          metadata: { conditions, script, sequence },
        };
        conv.nodes.push(startNode);
        conv.startNodeId = internalNodeId;
      } else {
        const actorExtId = parseInt(entry["@_Actor"]);
        const speakerId = !isNaN(actorExtId) ? actorExternalMap.get(actorExtId) ?? null : null;
        const speakerActor = actors.find((a) => a.id === speakerId);
        const isPlayer = speakerActor?.isPlayer || false;

        if (isPlayer) {
          const playerNode: AnyDialogueNode = {
            id: internalNodeId,
            externalId: entryId,
            type: "player_response",
            speakerId,
            conversantId: null,
            menuText,
            responseText: text,
            conditions: [],
            actions: [],
            conditionsString: conditions,
            script,
            sequence,
            falseConditionAction: "Block",
            priority: "Normal",
            fields: [],
            position: { x, y },
            metadata: {},
          };
          conv.nodes.push(playerNode);
        } else {
          const diagNode: AnyDialogueNode = {
            id: internalNodeId,
            externalId: entryId,
            type: "dialogue",
            speakerId,
            conversantId: null,
            menuText,
            dialogueText: text,
            conditions: [],
            actions: [],
            conditionsString: conditions,
            script,
            sequence,
            falseConditionAction: "Block",
            priority: "Normal",
            fields: [],
            position: { x, y },
            metadata: {},
          };
          conv.nodes.push(diagNode);
        }
      }
    }

    // Resolve links into connections
    for (const l of convLinks) {
      const sourceUuid = nodeEntryMap.get(l.sourceEntryId);
      const targetUuid = nodeEntryMap.get(l.targetEntryId);
      if (sourceUuid && targetUuid) {
        const conn: Connection = {
          id: uuidv4(),
          sourceNodeId: sourceUuid,
          targetNodeId: targetUuid,
          priority: 0,
          conditions: [],
          metadata: {},
        };
        conv.connections.push(conn);
      }
    }

    conversations.push(conv);
  }

  const now = new Date().toISOString();
  const project: Project = {
    format: "freewrite",
    schemaVersion: "1.0.0",
    project: {
      id: uuidv4(),
      name: projectName,
      description: projectDesc,
      author: projectAuthor,
      createdAt: now,
      updatedAt: now,
    },
    actors,
    conversations,
    variables,
    items: [],
    locations: [],
    documents: [],
    metadata: {
      applicationVersion: "0.1.0",
      exportSettings: {
        source: "ChatMapper_XML",
      },
    },
  };

  return { project, warnings };
}
