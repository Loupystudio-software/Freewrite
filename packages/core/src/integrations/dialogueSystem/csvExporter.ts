import type { Project } from "../../models/project.js";
import type { AnyDialogueNode } from "../../models/node.js";
import { formatCSVRow } from "./csvUtils.js";

export interface ExportCSVOptions {
  conversationIds?: string[];
  includeMetadata?: boolean;
}

export function exportProjectToDialogueSystemCSV(
  project: Project,
  options?: ExportCSVOptions
): string {
  const lines: string[] = [];

  // Filter conversations if requested
  const conversations = options?.conversationIds?.length
    ? project.conversations.filter((c) => options.conversationIds!.includes(c.id))
    : project.conversations;

  // 1. Build Actor ID Mappings (Internal UUID -> External Numeric ID)
  const actorIdMap = new Map<string, number>();
  let nextActorId = 0;

  for (const actor of project.actors) {
    const extId =
      typeof actor.externalId === "number" && !isNaN(actor.externalId)
        ? actor.externalId
        : nextActorId;
    actorIdMap.set(actor.id, extId);
    if (extId >= nextActorId) nextActorId = extId + 1;
  }

  // 2. Build Variable ID Mappings
  const variableIdMap = new Map<string, number>();
  let nextVarId = 0;
  for (const v of project.variables) {
    const extId =
      typeof v.externalId === "number" && !isNaN(v.externalId)
        ? v.externalId
        : nextVarId;
    variableIdMap.set(v.id, extId);
    if (extId >= nextVarId) nextVarId = extId + 1;
  }

  // 3. Build Conversation & Dialogue Entry ID Mappings
  const convIdMap = new Map<string, number>();
  // Maps conversationId -> Map(nodeId -> entryId)
  const nodeEntryIdMap = new Map<string, Map<string, number>>();

  let nextConvId = 1;
  for (const conv of conversations) {
    const extConvId =
      typeof conv.externalId === "number" && !isNaN(conv.externalId) && conv.externalId > 0
        ? conv.externalId
        : nextConvId;
    convIdMap.set(conv.id, extConvId);
    if (extConvId >= nextConvId) nextConvId = extConvId + 1;

    const entryMap = new Map<string, number>();
    nodeEntryIdMap.set(conv.id, entryMap);

    let nextEntryId = 1;

    // Check if start node exists
    const startNode =
      conv.nodes.find((n) => n.id === conv.startNodeId) ||
      conv.nodes.find((n) => n.type === "start");

    if (startNode) {
      entryMap.set(startNode.id, 0); // Start node is always entry 0
    }

    for (const node of conv.nodes) {
      if (node.id === startNode?.id) continue;

      let entryId: number;
      if (
        typeof node.externalId === "number" &&
        !isNaN(node.externalId) &&
        node.externalId > 0
      ) {
        entryId = node.externalId;
      } else {
        entryId = nextEntryId;
      }

      entryMap.set(node.id, entryId);
      if (entryId >= nextEntryId) nextEntryId = entryId + 1;
    }
  }

  // ==========================================
  // SECTION 1: DATABASE
  // ==========================================
  lines.push(
    "Database Name,Version,Author,Description,Emphasis1,Emphasis2,Emphasis3,Emphasis4"
  );
  lines.push(
    formatCSVRow([
      project.project.name || "Dialogue Database",
      "1.0",
      project.project.author || "",
      project.project.description || "",
      "#FF000000 biu",
      "#00FF0000 i",
      "#0000FF00 u",
      "#FFFF0000",
    ])
  );
  lines.push("Global User Script (luacode)");
  lines.push('""');
  lines.push("");

  // ==========================================
  // SECTION 2: ACTORS
  // ==========================================
  lines.push(
    "Actors ID,Portrait,AltPortraits,SpritePortrait,AltSpritePortraits,Name,Pictures,Description,IsPlayer"
  );
  lines.push("Number,Text,Text,Text,Text,Text,Text,Text,Boolean");

  for (const actor of project.actors) {
    const actId = actorIdMap.get(actor.id) ?? 0;
    lines.push(
      formatCSVRow([
        actId,
        actor.portrait || "",
        "",
        "",
        "",
        actor.name,
        "",
        actor.description || "",
        actor.isPlayer ? "True" : "False",
      ])
    );
  }
  lines.push("");

  // ==========================================
  // SECTION 3: VARIABLES
  // ==========================================
  lines.push("Variables ID,Name,Initial Value,Type,Description");
  lines.push("Number,Text,Text,Text,Text");

  for (const v of project.variables) {
    const varId = variableIdMap.get(v.id) ?? 0;
    let typeStr = "Text";
    let initVal = String(v.initialValue);

    if (v.type === "boolean") {
      typeStr = "Boolean";
      initVal = v.initialValue ? "True" : "False";
    } else if (v.type === "number") {
      typeStr = "Number";
      initVal = String(v.initialValue);
    }

    lines.push(
      formatCSVRow([varId, v.name, initVal, typeStr, v.description || ""])
    );
  }
  lines.push("");

  // ==========================================
  // SECTION 4: CONVERSATIONS
  // ==========================================
  lines.push("Conversations ID,Title,Description,Actor,Conversant");
  lines.push("Number,Text,Text,Number,Number");

  for (const conv of conversations) {
    const cId = convIdMap.get(conv.id) ?? 1;
    const actorId = conv.actorId ? actorIdMap.get(conv.actorId) ?? 0 : 0;
    const conversantId = conv.conversantId
      ? actorIdMap.get(conv.conversantId) ?? 1
      : 1;

    lines.push(
      formatCSVRow([cId, conv.title, conv.description || "", actorId, conversantId])
    );
  }
  lines.push("");

  // ==========================================
  // SECTION 5: DIALOGUE ENTRIES
  // ==========================================
  lines.push(
    "DialogueEntries entrytag,ConvID,ID,Actor,Conversant,MenuText,DialogueText,IsGroup,FalseConditionAction,ConditionPriority,Conditions,Script,Sequence,canvasRect"
  );
  lines.push(
    "Text,Number,Number,Number,Number,Text,Text,Boolean,Number,Number,Text,Text,Text,Text"
  );

  for (const conv of conversations) {
    const cId = convIdMap.get(conv.id) ?? 1;
    const defaultActorId = conv.actorId ? actorIdMap.get(conv.actorId) ?? 0 : 0;
    const defaultConversantId = conv.conversantId
      ? actorIdMap.get(conv.conversantId) ?? 1
      : 1;
    const entryMap = nodeEntryIdMap.get(conv.id)!;

    // 1. Entry 0: START entry
    const startNode =
      conv.nodes.find((n) => n.id === conv.startNodeId) ||
      conv.nodes.find((n) => n.type === "start");

    const startPos = startNode
      ? `${Math.round(startNode.position.x)};${Math.round(startNode.position.y)}`
      : "0;0";

    lines.push(
      formatCSVRow([
        "",
        cId,
        0,
        defaultActorId,
        defaultConversantId,
        "",
        "",
        "False",
        0,
        2,
        "",
        "",
        "",
        startPos,
      ])
    );

    // 2. All other nodes
    for (const node of conv.nodes) {
      if (node.id === startNode?.id) continue;
      const entryId = entryMap.get(node.id) ?? 1;

      let actor = defaultActorId;
      let conversant = defaultConversantId;
      let menuText = "";
      let dialogueText = "";
      let conditions = "";
      let script = "";
      let sequence = "";

      if ("speakerId" in node && node.speakerId) {
        actor = actorIdMap.get(node.speakerId) ?? defaultActorId;
      }
      if ("menuText" in node && node.menuText) {
        menuText = node.menuText;
      }
      if ("dialogueText" in node && node.dialogueText) {
        dialogueText = node.dialogueText;
      } else if ("responseText" in node && node.responseText) {
        dialogueText = node.responseText;
      }
      if ("conditionsString" in node && node.conditionsString) {
        conditions = node.conditionsString;
      } else if (node.type === "condition" && node.expression) {
        conditions = node.expression;
      }
      if ("script" in node && node.script) {
        script = node.script;
      } else if (node.type === "action" && node.actionType) {
        script = `${node.actionType}()`;
      }
      if ("sequence" in node && node.sequence) {
        sequence = node.sequence;
      }

      const canvasRect = `${Math.round(node.position.x)};${Math.round(node.position.y)}`;

      lines.push(
        formatCSVRow([
          "",
          cId,
          entryId,
          actor,
          conversant,
          menuText,
          dialogueText,
          "False",
          0,
          2,
          conditions,
          script,
          sequence,
          canvasRect,
        ])
      );
    }
  }
  lines.push("");

  // ==========================================
  // SECTION 6: OUTGOING LINKS
  // ==========================================
  lines.push("OutgoingLinks,OriginConvID,OriginID,DestConvID,DestID,IsConnector,Priority");
  lines.push("Number,Number,Number,Number,Number,Boolean,Number");

  for (const conv of conversations) {
    const cId = convIdMap.get(conv.id) ?? 1;
    const entryMap = nodeEntryIdMap.get(conv.id)!;

    for (const conn of conv.connections) {
      const originId = entryMap.get(conn.sourceNodeId);
      const destId = entryMap.get(conn.targetNodeId);

      if (originId !== undefined && destId !== undefined) {
        lines.push(
          formatCSVRow(["", cId, originId, cId, destId, "False", 2])
        );
      }
    }
  }

  return lines.join("\n");
}
