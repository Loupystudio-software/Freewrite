import { v4 as uuidv4 } from "uuid";
import type { Project } from "../../models/project.js";
import type { Actor } from "../../models/actor.js";
import type { Variable } from "../../models/variable.js";
import type { Conversation } from "../../models/conversation.js";
import type { AnyDialogueNode } from "../../models/node.js";
import type { Connection } from "../../models/connection.js";
import { parseCSVRows } from "./csvUtils.js";

export interface ImportCSVResult {
  project: Project;
  warnings: string[];
}

export function importProjectFromDialogueSystemCSV(csvText: string): ImportCSVResult {
  const warnings: string[] = [];
  const rows = parseCSVRows(csvText);

  let projectName = "Imported Dialogue System";
  let projectAuthor = "";
  let projectDescription = "";

  const actors: Actor[] = [];
  const actorExternalMap = new Map<number, string>(); // extId -> internal uuid

  const variables: Variable[] = [];
  const conversations: Conversation[] = [];
  const convExternalMap = new Map<number, Conversation>(); // extId -> Conversation

  // Maps "convId:entryId" -> internal node UUID
  const nodeEntryMap = new Map<string, string>();

  // Temporary container for outgoing links to resolve after all nodes are parsed
  interface RawLink {
    originConvId: number;
    originId: number;
    destConvId: number;
    destId: number;
    priority: number;
  }
  const rawLinks: RawLink[] = [];

  let currentSection = "";
  let sectionHeaderRow: string[] = [];

  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) {
      i++;
      continue;
    }

    const firstCell = row[0].trim();

    // Section detection
    if (firstCell.startsWith("Database Name")) {
      currentSection = "Database";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length) {
        const dataRow = rows[i];
        projectName = dataRow[0] || projectName;
        projectAuthor = dataRow[2] || "";
        projectDescription = dataRow[3] || "";
      }
      i++;
      continue;
    }

    if (firstCell.startsWith("Global User Script")) {
      currentSection = "GlobalScript";
      i += 2; // skip header and script body
      continue;
    }

    if (firstCell.startsWith("Actors ID")) {
      currentSection = "Actors";
      sectionHeaderRow = row;
      i++;
      // Skip type definition row (e.g. "Number,Text,Text...")
      if (i < rows.length && rows[i][0]?.trim().toLowerCase() === "number") {
        i++;
      }
      continue;
    }

    if (firstCell.startsWith("Items ID")) {
      currentSection = "Items";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && rows[i][0]?.trim().toLowerCase() === "number") i++;
      continue;
    }

    if (firstCell.startsWith("Locations ID")) {
      currentSection = "Locations";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && rows[i][0]?.trim().toLowerCase() === "number") i++;
      continue;
    }

    if (firstCell.startsWith("Variables ID")) {
      currentSection = "Variables";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && rows[i][0]?.trim().toLowerCase() === "number") i++;
      continue;
    }

    if (firstCell.startsWith("Conversations ID")) {
      currentSection = "Conversations";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && rows[i][0]?.trim().toLowerCase() === "number") i++;
      continue;
    }

    if (firstCell.startsWith("DialogueEntries")) {
      currentSection = "DialogueEntries";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && (rows[i][0]?.trim().toLowerCase() === "text" || rows[i][1]?.trim().toLowerCase() === "number")) {
        i++;
      }
      continue;
    }

    if (firstCell.startsWith("OutgoingLinks") || row[1]?.trim() === "OriginConvID") {
      currentSection = "OutgoingLinks";
      sectionHeaderRow = row;
      i++;
      if (i < rows.length && rows[i][1]?.trim().toLowerCase() === "number") i++;
      continue;
    }

    // Process data rows based on section
    if (currentSection === "Actors") {
      const extId = parseInt(row[0]);
      if (!isNaN(extId)) {
        const actorName = row[5] || `Actor ${extId}`;
        const desc = row[7] || "";
        const isPlayer = row[8]?.toLowerCase() === "true";
        const portrait = row[1] || null;

        const internalId = uuidv4();
        actorExternalMap.set(extId, internalId);

        actors.push({
          id: internalId,
          externalId: extId,
          name: actorName,
          description: desc,
          isPlayer,
          pictures: [],
          portrait,
          color: isPlayer ? "#10b981" : "#3b82f6",
          fields: [],
          metadata: {},
        });
      }
    } else if (currentSection === "Variables") {
      const extId = parseInt(row[0]);
      if (!isNaN(extId)) {
        const varName = row[1] || `Variable_${extId}`;
        const rawVal = row[2] || "";
        const typeStr = (row[3] || "").toLowerCase();
        const desc = row[4] || "";

        let varType: "boolean" | "number" | "string" = "string";
        let initialValue: boolean | number | string = rawVal;

        if (typeStr === "boolean") {
          varType = "boolean";
          initialValue = rawVal.toLowerCase() === "true";
        } else if (typeStr === "number") {
          varType = "number";
          initialValue = isNaN(Number(rawVal)) ? 0 : Number(rawVal);
        }

        variables.push({
          id: uuidv4(),
          externalId: extId,
          name: varName,
          type: varType,
          initialValue,
          description: desc,
        });
      }
    } else if (currentSection === "Conversations") {
      const extId = parseInt(row[0]);
      if (!isNaN(extId)) {
        const title = row[1] || `Conversation ${extId}`;
        const desc = row[2] || "";
        const actorExtId = parseInt(row[3]);
        const conversantExtId = parseInt(row[4]);

        const conv: Conversation = {
          id: uuidv4(),
          externalId: extId,
          title,
          description: desc,
          actorId: !isNaN(actorExtId) ? actorExternalMap.get(actorExtId) ?? null : null,
          conversantId: !isNaN(conversantExtId)
            ? actorExternalMap.get(conversantExtId) ?? null
            : null,
          priority: "Normal",
          startNodeId: null,
          nodes: [],
          connections: [],
          fields: [],
          metadata: {},
        };

        conversations.push(conv);
        convExternalMap.set(extId, conv);
      }
    } else if (currentSection === "DialogueEntries") {
      // Columns: entrytag,ConvID,ID,Actor,Conversant,MenuText,DialogueText,IsGroup,FalseConditionAction,ConditionPriority,Conditions,Script,Sequence,canvasRect
      const convId = parseInt(row[1]);
      const entryId = parseInt(row[2]);

      if (!isNaN(convId) && !isNaN(entryId)) {
        const conv = convExternalMap.get(convId);
        if (conv) {
          const actorExtId = parseInt(row[3]);
          const speakerId = !isNaN(actorExtId) ? actorExternalMap.get(actorExtId) ?? null : null;
          const menuText = row[5] || "";
          const dialogueText = row[6] || "";
          const conditions = row[10] || "";
          const script = row[11] || "";
          const sequence = row[12] || "";

          // Parse canvas coordinates from canvasRect
          let x = 100;
          let y = 100 + entryId * 120;
          const rawRect = row[13] || row[row.length - 1];
          if (rawRect && rawRect.includes(";")) {
            const parts = rawRect.split(";").map((p) => parseFloat(p));
            if (!isNaN(parts[0]) && !isNaN(parts[1])) {
              x = Math.round(parts[0]);
              y = Math.round(parts[1]);
            }
          }

          const internalNodeId = uuidv4();
          nodeEntryMap.set(`${convId}:${entryId}`, internalNodeId);

          if (entryId === 0) {
            // START entry
            const startNode: AnyDialogueNode = {
              id: internalNodeId,
              externalId: 0,
              type: "start",
              label: dialogueText || "Start",
              position: { x, y },
              metadata: { conditions, script, sequence },
            };
            conv.nodes.push(startNode);
            conv.startNodeId = internalNodeId;
          } else {
            // Check if speaker is a player
            const speakerActor = actors.find((a) => a.id === speakerId);
            const isPlayerSpeaker = speakerActor?.isPlayer || false;

            if (isPlayerSpeaker) {
              const playerNode: AnyDialogueNode = {
                id: internalNodeId,
                externalId: entryId,
                type: "player_response",
                speakerId,
                conversantId: null,
                menuText,
                responseText: dialogueText,
                conditions: [],
                actions: [],
                conditionsString: conditions,
                script,
                sequence,
                falseConditionAction: (row[8] as any) === "Passthrough" ? "Passthrough" : "Block",
                priority: (row[9] as any) || "Normal",
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
                dialogueText,
                conditions: [],
                actions: [],
                conditionsString: conditions,
                script,
                sequence,
                falseConditionAction: (row[8] as any) === "Passthrough" ? "Passthrough" : "Block",
                priority: (row[9] as any) || "Normal",
                fields: [],
                position: { x, y },
                metadata: {},
              };
              conv.nodes.push(diagNode);
            }
          }
        }
      }
    } else if (currentSection === "OutgoingLinks") {
      // Row format: ,OriginConvID,OriginID,DestConvID,DestID,IsConnector,Priority
      // or OriginConvID,OriginID,DestConvID,DestID,IsConnector,Priority
      let offset = 0;
      if (row[0] === "" || isNaN(parseInt(row[0]))) offset = 1;

      const originConvId = parseInt(row[offset]);
      const originId = parseInt(row[offset + 1]);
      const destConvId = parseInt(row[offset + 2]);
      const destId = parseInt(row[offset + 3]);
      const priority = parseInt(row[offset + 5]) || 0;

      if (!isNaN(originConvId) && !isNaN(originId) && !isNaN(destConvId) && !isNaN(destId)) {
        rawLinks.push({
          originConvId,
          originId,
          destConvId,
          destId,
          priority,
        });
      }
    }

    i++;
  }

  // Resolve OutgoingLinks into internal connections
  for (const link of rawLinks) {
    const sourceNodeId = nodeEntryMap.get(`${link.originConvId}:${link.originId}`);
    const targetNodeId = nodeEntryMap.get(`${link.destConvId}:${link.destId}`);
    const conv = convExternalMap.get(link.originConvId);

    if (sourceNodeId && targetNodeId && conv) {
      const conn: Connection = {
        id: uuidv4(),
        sourceNodeId,
        targetNodeId,
        priority: link.priority,
        conditions: [],
        metadata: {},
      };
      conv.connections.push(conn);
    } else {
      warnings.push(
        `Could not resolve link: Conv ${link.originConvId} Entry ${link.originId} -> Conv ${link.destConvId} Entry ${link.destId}`
      );
    }
  }

  const now = new Date().toISOString();
  const project: Project = {
    format: "freewrite",
    schemaVersion: "1.0.0",
    project: {
      id: uuidv4(),
      name: projectName,
      description: projectDescription,
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
        source: "PixelCrushers_CSV",
      },
    },
  };

  return { project, warnings };
}
