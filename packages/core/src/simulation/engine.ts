import type { Conversation } from "../models/conversation.js";
import type { Project } from "../models/project.js";
import type { AnyDialogueNode } from "../models/node.js";
import {
  createVariableEnvironment,
  evaluateCondition,
  evaluateExpressionString,
  executeAction,
  type VariableEnvironment,
  type VariableValue,
} from "./evaluator.js";
import { DS4ULuaRuntime } from "./luaEngine.js";

export interface SimulationChoice {
  targetNodeId: string;
  menuText: string;
  responseText: string;
  speakerId: string | null;
  conversantId?: string | null;
  enabled?: boolean;
}

export interface SimulationHistoryEntry {
  stepIndex: number;
  nodeId: string;
  nodeType: AnyDialogueNode["type"];
  speakerName?: string;
  speakerId?: string | null;
  conversantName?: string;
  conversantId?: string | null;
  text?: string;
  menuText?: string;
  sequence?: string;
  executedActions?: string[];
  alerts?: string[];
  timestamp: number;
}

export type SimulationStatus = "idle" | "running" | "waiting_for_choice" | "ended";

export interface SimulationState {
  status: SimulationStatus;
  currentNodeId: string | null;
  currentNode: AnyDialogueNode | null;
  currentSpeakerName: string;
  currentConversantName: string;
  availableChoices: SimulationChoice[];
  history: SimulationHistoryEntry[];
  variables: VariableEnvironment;
  alerts: string[];
  error?: string;
}

export class DialogueSimulationEngine {
  private project: Project;
  private conversation: Conversation;
  private state: SimulationState;
  private luaRuntime: DS4ULuaRuntime;

  constructor(
    conversation: Conversation,
    project: Project,
    initialVariableOverrides?: Record<string, VariableValue>
  ) {
    this.conversation = conversation;
    this.project = project;

    const env = createVariableEnvironment(
      project.variables,
      initialVariableOverrides
    );

    this.luaRuntime = new DS4ULuaRuntime(project);

    // Apply any initial variable overrides to Lua runtime
    if (initialVariableOverrides) {
      for (const [k, v] of Object.entries(initialVariableOverrides)) {
        this.luaRuntime.setVariable(k, v);
      }
    }

    this.state = {
      status: "idle",
      currentNodeId: null,
      currentNode: null,
      currentSpeakerName: "",
      currentConversantName: "",
      availableChoices: [],
      history: [],
      variables: env,
      alerts: [],
    };
  }

  public getLuaRuntime(): DS4ULuaRuntime {
    return this.luaRuntime;
  }

  public getState(): SimulationState {
    return {
      ...this.state,
      availableChoices: [...this.state.availableChoices],
      history: [...this.state.history],
      variables: { ...this.state.variables },
      alerts: [...this.state.alerts],
    };
  }

  public setVariable(nameOrId: string, value: VariableValue): void {
    this.state.variables[nameOrId] = value;
    const found = this.project.variables.find(
      (v) => v.id === nameOrId || v.name === nameOrId
    );
    if (found) {
      this.state.variables[found.id] = value;
      this.state.variables[found.name] = value;
      this.luaRuntime.setVariable(found.name, value);
    } else {
      this.luaRuntime.setVariable(nameOrId, value);
    }
  }

  public start(): SimulationState {
    let startNodeId = this.conversation.startNodeId;
    if (!startNodeId) {
      const startNode = this.conversation.nodes.find((n) => n.type === "start");
      if (startNode) startNodeId = startNode.id;
    }

    if (!startNodeId) {
      if (this.conversation.nodes.length > 0) {
        startNodeId = this.conversation.nodes[0].id;
      } else {
        this.state.status = "ended";
        this.state.error = "Conversation has no nodes to simulate.";
        return this.getState();
      }
    }

    this.state.status = "running";
    this.state.history = [];
    this.state.alerts = [];

    // Advance into starting node
    this.navigateToNode(startNodeId);
    return this.getState();
  }

  public choose(targetNodeId: string): SimulationState {
    if (this.state.status !== "waiting_for_choice" && this.state.status !== "running") {
      return this.getState();
    }

    const choiceNode = this.conversation.nodes.find((n) => n.id === targetNodeId);
    if (!choiceNode) {
      this.state.error = `Choice node ${targetNodeId} not found.`;
      return this.getState();
    }

    // Execute choice node
    if (choiceNode.type === "player_response") {
      const speaker = this.resolveSpeaker(choiceNode.speakerId) || "Player";
      const conversant = this.resolveSpeaker(choiceNode.conversantId);

      this.luaRuntime.setConversationContext(speaker, conversant);

      // Execute Lua script if present
      let alerts: string[] = [];
      if (choiceNode.script) {
        const scriptRes = this.luaRuntime.executeScript(choiceNode.script, {
          actorName: speaker,
          conversantName: conversant,
        });
        if (scriptRes.alerts.length > 0) {
          alerts = scriptRes.alerts;
          this.state.alerts.push(...alerts);
        }
      }

      // Execute legacy actions if any
      this.executeNodeActions(choiceNode);
      this.syncVariablesFromLua();

      const rawText = choiceNode.responseText || choiceNode.menuText;
      const evaluatedText = this.luaRuntime.evaluateText(rawText);

      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: choiceNode.id,
        nodeType: choiceNode.type,
        speakerName: speaker,
        speakerId: choiceNode.speakerId,
        conversantName: conversant,
        conversantId: choiceNode.conversantId,
        text: evaluatedText,
        menuText: choiceNode.menuText,
        sequence: choiceNode.sequence,
        alerts,
        timestamp: Date.now(),
      });

      // Update SimStatus in Lua
      const cId = this.conversation.externalId ?? this.conversation.id;
      const nId = choiceNode.externalId ?? choiceNode.id;
      this.luaRuntime.setSimStatus(cId, nId, "WasDisplayed");
    }

    // Advance from choice node
    this.advanceFromNode(choiceNode.id);
    return this.getState();
  }

  public next(): SimulationState {
    if (this.state.status !== "running" || !this.state.currentNodeId) {
      return this.getState();
    }

    this.advanceFromNode(this.state.currentNodeId);
    return this.getState();
  }

  private navigateToNode(nodeId: string): void {
    const node = this.conversation.nodes.find((n) => n.id === nodeId);
    if (!node) {
      this.state.status = "ended";
      return;
    }

    this.state.currentNodeId = node.id;
    this.state.currentNode = node;

    // Start node: advance immediately
    if (node.type === "start") {
      this.advanceFromNode(node.id);
      return;
    }

    // Action node: execute and advance
    if (node.type === "action") {
      const executed: string[] = [];
      const res = executeAction(node, this.state.variables);
      if (res.modifiedKey) {
        executed.push(`Set ${res.modifiedKey} = ${String(res.newValue)}`);
        this.luaRuntime.setVariable(res.modifiedKey, res.newValue as any);
      }

      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        text: node.actionType || "Action executed",
        executedActions: executed,
        timestamp: Date.now(),
      });

      this.advanceFromNode(node.id);
      return;
    }

    // Condition node
    if (node.type === "condition") {
      // First try Lua if expression looks like Lua or evaluate via evaluator
      let passes = false;
      const luaRes = this.luaRuntime.evaluateCondition(node.expression);
      if (!luaRes.error) {
        passes = luaRes.passed;
      } else {
        passes = evaluateExpressionString(node.expression, this.state.variables);
      }

      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        text: `Condition [${node.expression}] evaluated to ${passes ? "TRUE" : "FALSE"}`,
        timestamp: Date.now(),
      });

      const outgoing = this.conversation.connections.filter(
        (c) => c.sourceNodeId === node.id
      );

      if (outgoing.length === 0) {
        this.state.status = "ended";
        return;
      }

      if (passes) {
        this.navigateToNode(outgoing[0].targetNodeId);
      } else if (outgoing.length > 1) {
        this.navigateToNode(outgoing[1].targetNodeId);
      } else {
        this.state.status = "ended";
      }
      return;
    }

    // End node
    if (node.type === "end") {
      this.state.status = "ended";
      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        text: "Conversation ended",
        timestamp: Date.now(),
      });
      return;
    }

    // Dialogue node
    if (node.type === "dialogue") {
      const speaker = this.resolveSpeaker(node.speakerId) || "Narrator";
      const conversant = this.resolveSpeaker(node.conversantId);

      this.state.currentSpeakerName = speaker;
      this.state.currentConversantName = conversant;

      this.luaRuntime.setConversationContext(speaker, conversant);

      // Check node condition if present
      if (node.conditionsString) {
        const condRes = this.luaRuntime.evaluateCondition(node.conditionsString, {
          actorName: speaker,
          conversantName: conversant,
        });
        if (!condRes.passed && node.falseConditionAction === "Block") {
          this.state.status = "ended";
          this.state.error = `Condition blocked: ${node.conditionsString}`;
          return;
        }
      }

      // Execute Lua script if present
      let alerts: string[] = [];
      if (node.script) {
        const scriptRes = this.luaRuntime.executeScript(node.script, {
          actorName: speaker,
          conversantName: conversant,
        });
        if (scriptRes.alerts.length > 0) {
          alerts = scriptRes.alerts;
          this.state.alerts.push(...alerts);
        }
      }

      // Execute legacy actions if any
      this.executeNodeActions(node);
      this.syncVariablesFromLua();

      // Evaluate dialogue text with [lua()] and [var=] markup
      const evaluatedText = this.luaRuntime.evaluateText(node.dialogueText);

      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        speakerName: speaker,
        speakerId: node.speakerId,
        conversantName: conversant,
        conversantId: node.conversantId,
        text: evaluatedText,
        menuText: node.menuText,
        sequence: node.sequence,
        alerts,
        timestamp: Date.now(),
      });

      // Update SimStatus in Lua
      const cId = this.conversation.externalId ?? this.conversation.id;
      const nId = node.externalId ?? node.id;
      this.luaRuntime.setSimStatus(cId, nId, "WasDisplayed");

      // Check outgoing nodes for player choices
      const outgoing = this.getValidOutgoing(node.id);
      const playerChoices: SimulationChoice[] = [];

      for (const targetId of outgoing) {
        const targetNode = this.conversation.nodes.find((n) => n.id === targetId);
        if (targetNode && targetNode.type === "player_response") {
          // Check condition on the response node
          let choiceAllowed = true;
          if (targetNode.conditionsString) {
            const respCond = this.luaRuntime.evaluateCondition(
              targetNode.conditionsString,
              { actorName: speaker, conversantName: conversant }
            );
            if (!respCond.passed && targetNode.falseConditionAction === "Block") {
              choiceAllowed = false;
            }
          }

          if (choiceAllowed) {
            playerChoices.push({
              targetNodeId: targetNode.id,
              menuText: targetNode.menuText || targetNode.responseText,
              responseText: this.luaRuntime.evaluateText(targetNode.responseText),
              speakerId: targetNode.speakerId,
              conversantId: targetNode.conversantId,
              enabled: true,
            });

            // Mark choice WasOffered in Lua
            const choiceNId = targetNode.externalId ?? targetNode.id;
            this.luaRuntime.setSimStatus(cId, choiceNId, "WasOffered");
          }
        }
      }

      if (playerChoices.length > 0) {
        this.state.status = "waiting_for_choice";
        this.state.availableChoices = playerChoices;
      } else {
        this.state.status = "running";
        this.state.availableChoices = [];
      }
      return;
    }

    this.advanceFromNode(node.id);
  }

  private advanceFromNode(nodeId: string): void {
    const validTargets = this.getValidOutgoing(nodeId);

    if (validTargets.length === 0) {
      this.state.status = "ended";
      return;
    }

    const choiceTargets: SimulationChoice[] = [];
    for (const tId of validTargets) {
      const tNode = this.conversation.nodes.find((n) => n.id === tId);
      if (tNode && tNode.type === "player_response") {
        let choiceAllowed = true;
        if (tNode.conditionsString) {
          const respCond = this.luaRuntime.evaluateCondition(tNode.conditionsString);
          if (!respCond.passed && tNode.falseConditionAction === "Block") {
            choiceAllowed = false;
          }
        }

        if (choiceAllowed) {
          choiceTargets.push({
            targetNodeId: tNode.id,
            menuText: tNode.menuText || tNode.responseText,
            responseText: this.luaRuntime.evaluateText(tNode.responseText),
            speakerId: tNode.speakerId,
            conversantId: tNode.conversantId,
            enabled: true,
          });
        }
      }
    }

    if (choiceTargets.length > 0) {
      this.state.status = "waiting_for_choice";
      this.state.availableChoices = choiceTargets;
      return;
    }

    this.navigateToNode(validTargets[0]);
  }

  private getValidOutgoing(nodeId: string): string[] {
    const conns = this.conversation.connections
      .filter((c) => c.sourceNodeId === nodeId)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const validTargets: string[] = [];

    for (const conn of conns) {
      const satisfiesConditions = conn.conditions.every((cond) =>
        evaluateCondition(cond, this.state.variables)
      );

      if (satisfiesConditions) {
        validTargets.push(conn.targetNodeId);
      }
    }

    return validTargets;
  }

  private executeNodeActions(node: AnyDialogueNode): void {
    if ("actions" in node && Array.isArray(node.actions)) {
      for (const act of node.actions) {
        executeAction(act, this.state.variables);
      }
    }
  }

  private syncVariablesFromLua(): void {
    const luaVars = this.luaRuntime.getAllVariables();
    for (const [k, v] of Object.entries(luaVars)) {
      this.state.variables[k] = v;
      const found = this.project.variables.find((vObj) => vObj.name === k);
      if (found) {
        this.state.variables[found.id] = v;
      }
    }
  }

  private resolveSpeaker(speakerId?: string | null): string {
    if (!speakerId) return "";
    const actor = this.project.actors.find((a) => a.id === speakerId);
    return actor ? actor.name : "";
  }
}
