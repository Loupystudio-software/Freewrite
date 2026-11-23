import type { Project } from "../../models/project.js";

export function exportProjectToChatMapperXML(project: Project): string {
  // Build Actor ID Mappings
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

  // Build Variable ID Mappings
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

  // Build Conversation & Node Mappings
  const convIdMap = new Map<string, number>();
  const nodeEntryIdMap = new Map<string, Map<string, number>>();

  let nextConvId = 1;
  for (const conv of project.conversations) {
    const cId =
      typeof conv.externalId === "number" && !isNaN(conv.externalId) && conv.externalId > 0
        ? conv.externalId
        : nextConvId;
    convIdMap.set(conv.id, cId);
    if (cId >= nextConvId) nextConvId = cId + 1;

    const entryMap = new Map<string, number>();
    nodeEntryIdMap.set(conv.id, entryMap);

    const startNode =
      conv.nodes.find((n) => n.id === conv.startNodeId) ||
      conv.nodes.find((n) => n.type === "start");

    if (startNode) {
      entryMap.set(startNode.id, 0);
    }

    let nextEntryId = 1;
    for (const node of conv.nodes) {
      if (node.id === startNode?.id) continue;
      const entryId =
        typeof node.externalId === "number" && !isNaN(node.externalId) && node.externalId > 0
          ? node.externalId
          : nextEntryId;
      entryMap.set(node.id, entryId);
      if (entryId >= nextEntryId) nextEntryId = entryId + 1;
    }
  }

  const escapeXML = (str: string | number | boolean | null | undefined): string => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const xml: string[] = [];
  xml.push('<?xml version="1.0" encoding="utf-8"?>');
  xml.push(
    '<ChatMapperProject xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
  );
  xml.push(`  <Title>${escapeXML(project.project.name)}</Title>`);
  xml.push(`  <Description>${escapeXML(project.project.description)}</Description>`);
  xml.push(`  <Author>${escapeXML(project.project.author)}</Author>`);

  // Actors
  xml.push("  <Actors>");
  for (const actor of project.actors) {
    const actId = actorIdMap.get(actor.id) ?? 0;
    xml.push(`    <Actor ID="${actId}" Name="${escapeXML(actor.name)}">`);
    xml.push("      <Fields>");
    xml.push(
      `        <Field Name="IsPlayer" Type="Boolean">${actor.isPlayer ? "True" : "False"}</Field>`
    );
    if (actor.description) {
      xml.push(
        `        <Field Name="Description" Type="Text">${escapeXML(actor.description)}</Field>`
      );
    }
    xml.push("      </Fields>");
    xml.push("    </Actor>");
  }
  xml.push("  </Actors>");

  // Variables
  xml.push("  <Variables>");
  for (const v of project.variables) {
    const varId = variableIdMap.get(v.id) ?? 0;
    const typeStr =
      v.type === "boolean" ? "Boolean" : v.type === "number" ? "Number" : "Text";
    const initVal =
      v.type === "boolean" ? (v.initialValue ? "True" : "False") : String(v.initialValue);
    xml.push(
      `    <Variable ID="${varId}" Type="${typeStr}" Default="${escapeXML(initVal)}">${escapeXML(
        v.name
      )}</Variable>`
    );
  }
  xml.push("  </Variables>");

  // Conversations
  xml.push("  <Conversations>");
  for (const conv of project.conversations) {
    const cId = convIdMap.get(conv.id) ?? 1;
    xml.push(`    <Conversation ID="${cId}" Title="${escapeXML(conv.title)}">`);
    xml.push("      <DialogEntries>");

    const entryMap = nodeEntryIdMap.get(conv.id)!;
    const startNode =
      conv.nodes.find((n) => n.id === conv.startNodeId) ||
      conv.nodes.find((n) => n.type === "start");

    // Start node / Entry 0
    const startLinks = conv.connections.filter(
      (c) => c.sourceNodeId === startNode?.id
    );
    const startPos = startNode
      ? `${Math.round(startNode.position.x)};${Math.round(startNode.position.y)}`
      : "0;0";

    xml.push(`        <DialogEntry ID="0" PID="0" IsRoot="true">`);
    xml.push("          <Fields>");
    xml.push(`            <Field Name="canvasRect" Type="Text">${startPos}</Field>`);
    xml.push("          </Fields>");
    xml.push("          <Text>START</Text>");
    if (startLinks.length > 0) {
      xml.push("          <Links>");
      for (const link of startLinks) {
        const destId = entryMap.get(link.targetNodeId);
        if (destId !== undefined) {
          xml.push(
            `            <Link OriginConversationID="${cId}" OriginDialogEntryID="0" DestinationConversationID="${cId}" DestinationDialogEntryID="${destId}" IsDefault="true" />`
          );
        }
      }
      xml.push("          </Links>");
    }
    xml.push("        </DialogEntry>");

    // Remaining nodes
    for (const node of conv.nodes) {
      if (node.id === startNode?.id) continue;
      const entryId = entryMap.get(node.id) ?? 1;

      let actor = 0;
      let conversant = 1;
      let dialogueText = "";
      let menuText = "";
      let conditions = "";
      let script = "";
      let sequence = "";

      if ("speakerId" in node && node.speakerId) {
        actor = actorIdMap.get(node.speakerId) ?? 0;
      }
      if ("dialogueText" in node && node.dialogueText) {
        dialogueText = node.dialogueText;
      } else if ("responseText" in node && node.responseText) {
        dialogueText = node.responseText;
      }
      if ("menuText" in node && node.menuText) {
        menuText = node.menuText;
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
      const nodeLinks = conv.connections.filter((c) => c.sourceNodeId === node.id);

      xml.push(
        `        <DialogEntry ID="${entryId}" PID="${entryId}" Actor="${actor}" Conversant="${conversant}">`
      );
      xml.push("          <Fields>");
      if (menuText) {
        xml.push(
          `            <Field Name="Menu Text" Type="Text">${escapeXML(menuText)}</Field>`
        );
      }
      if (sequence) {
        xml.push(
          `            <Field Name="Sequence" Type="Text">${escapeXML(sequence)}</Field>`
        );
      }
      xml.push(
        `            <Field Name="canvasRect" Type="Text">${canvasRect}</Field>`
      );
      xml.push("          </Fields>");
      xml.push(`          <Text>${escapeXML(dialogueText)}</Text>`);
      if (conditions) {
        xml.push(`          <ConditionsString>${escapeXML(conditions)}</ConditionsString>`);
      }
      if (script) {
        xml.push(`          <UserScript>${escapeXML(script)}</UserScript>`);
      }

      if (nodeLinks.length > 0) {
        xml.push("          <Links>");
        for (const link of nodeLinks) {
          const destId = entryMap.get(link.targetNodeId);
          if (destId !== undefined) {
            xml.push(
              `            <Link OriginConversationID="${cId}" OriginDialogEntryID="${entryId}" DestinationConversationID="${cId}" DestinationDialogEntryID="${destId}" IsDefault="true" />`
            );
          }
        }
        xml.push("          </Links>");
      }

      xml.push("        </DialogEntry>");
    }

    xml.push("      </DialogEntries>");
    xml.push("    </Conversation>");
  }
  xml.push("  </Conversations>");

  xml.push("</ChatMapperProject>");
  return xml.join("\n");
}
