import { v4 as uuidv4 } from "uuid";
import type {
  AnyDialogueNode,
  Connection,
  Conversation,
  Project,
} from "@freewrite/core";

/**
 * Articy:Draft-style "Convert Document to Flow":
 * Parses a screenplay/text section into a new Conversation with Start node,
 * Dialogue / Player Response nodes, and sequential connections.
 */
export function convertSectionToConversation(
  sectionTitle: string,
  content: string,
  project: Project
): Conversation {
  const convId = uuidv4();
  const startNodeId = uuidv4();
  const nodes: AnyDialogueNode[] = [
    {
      id: startNodeId,
      type: "start",
      label: "Start",
      position: { x: 80, y: 180 },
      metadata: {},
    },
  ];
  const connections: Connection[] = [];

  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let prevNodeId = startNodeId;
  let xOffset = 340;
  let pendingStageNote = "";

  for (const line of lines) {
    if (line.startsWith("(") && line.endsWith(")")) {
      pendingStageNote = pendingStageNote
        ? `${pendingStageNote} ${line}`
        : line;
      continue;
    }

    const colonIdx = line.indexOf(":");
    let speakerRaw = "Narrator";
    let text = line;

    if (colonIdx > 0 && colonIdx < 32) {
      speakerRaw = line.slice(0, colonIdx).trim();
      text = line.slice(colonIdx + 1).trim();
    }

    const matchedActor = project.actors.find(
      (a) => a.name.toLowerCase() === speakerRaw.toLowerCase()
    );
    const isPlayer =
      speakerRaw.toUpperCase() === "PLAYER" ||
      speakerRaw.startsWith(">") ||
      Boolean(matchedActor?.isPlayer);

    const nodeId = uuidv4();

    if (isPlayer) {
      nodes.push({
        id: nodeId,
        type: "player_response",
        position: { x: xOffset, y: 180 },
        speakerId: matchedActor?.id ?? null,
        conversantId: null,
        responseText: text || "...",
        menuText: "",
        conditions: [],
        actions: [],
        conditionsString: "",
        script: "",
        sequence: pendingStageNote ? `// ${pendingStageNote}` : "",
        falseConditionAction: "Block",
        priority: "Normal",
        fields: [],
        metadata: {},
      });
    } else {
      nodes.push({
        id: nodeId,
        type: "dialogue",
        position: { x: xOffset, y: 180 },
        speakerId: matchedActor?.id ?? null,
        conversantId: null,
        menuText: "",
        dialogueText: text || "...",
        conditions: [],
        actions: [],
        conditionsString: "",
        script: "",
        sequence: pendingStageNote ? `// ${pendingStageNote}` : "",
        falseConditionAction: "Block",
        priority: "Normal",
        fields: [],
        metadata: {},
      });
    }

    connections.push({
      id: uuidv4(),
      sourceNodeId: prevNodeId,
      targetNodeId: nodeId,
      conditions: [],
      priority: 0,
      metadata: {},
    });

    prevNodeId = nodeId;
    xOffset += 280;
    pendingStageNote = "";
  }

  return {
    id: convId,
    title: sectionTitle.trim() || "Converted Scene",
    description: "Converted from Narrative Document screenplay section.",
    actorId: null,
    conversantId: null,
    priority: "Normal",
    startNodeId,
    nodes,
    connections,
    fields: [],
    metadata: {},
  };
}
