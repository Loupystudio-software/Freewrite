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

export interface SimulationChoice {
  targetNodeId: string;
  menuText: string;
  responseText: string;
  speakerId: string | null;
}

export interface SimulationHistoryEntry {
  stepIndex: number;
  nodeId: string;
  nodeType: AnyDialogueNode["type"];
  speakerName?: string;
  speakerId?: string | null;
  text?: string;
  menuText?: string;
  executedActions?: string[];
  timestamp: number;
}

export type SimulationStatus = "idle" | "running" | "waiting_for_choice" | "ended";

export interface SimulationState {
  status: SimulationStatus;
  currentNodeId: string | null;
  currentNode: AnyDialogueNode | null;
  currentSpeakerName: string;
  availableChoices: SimulationChoice[];
  history: SimulationHistoryEntry[];
  variables: VariableEnvironment;
  error?: string;
}

export class DialogueSimulationEngine {
  private project: Project;
  private conversation: Conversation;
  private state: SimulationState;

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

    this.state = {
      status: "idle",
      currentNodeId: null,
      currentNode: null,
      currentSpeakerName: "",
      availableChoices: [],
      history: [],
      variables: env,
    };
  }

  public getState(): SimulationState {
    return {
      ...this.state,
      availableChoices: [...this.state.availableChoices],
      history: [...this.state.history],
      variables: { ...this.state.variables },
    };
  }

  public setVariable(nameOrId: string, value: VariableValue): void {
    this.state.variables[nameOrId] = value;
    // If nameOrId is an ID, also update the variable's name key if known
    const found = this.project.variables.find(
      (v) => v.id === nameOrId || v.name === nameOrId
    );
    if (found) {
      this.state.variables[found.id] = value;
      this.state.variables[found.name] = value;
    }
  }

  public start(): SimulationState {
    // 1. Locate entry point
    let startNodeId = this.conversation.startNodeId;
    if (!startNodeId) {
      const startNode = this.conversation.nodes.find((n) => n.type === "start");
      if (startNode) startNodeId = startNode.id;
    }

    if (!startNodeId) {
      // If no start node, pick first node if available
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

    // Record the chosen option into history
    if (choiceNode.type === "player_response") {
      const speaker = this.resolveSpeaker(choiceNode.speakerId);
      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: choiceNode.id,
        nodeType: choiceNode.type,
        speakerName: speaker || "Player",
        speakerId: choiceNode.speakerId,
        text: choiceNode.responseText || choiceNode.menuText,
        menuText: choiceNode.menuText,
        timestamp: Date.now(),
      });

      // Execute any node actions if present
      this.executeNodeActions(choiceNode);
    }

    // Now advance from this choice node to its targets
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

    // Handle Start node: auto-advance immediately to next node
    if (node.type === "start") {
      this.advanceFromNode(node.id);
      return;
    }

    // Handle Action node: execute and auto-advance
    if (node.type === "action") {
      const executed: string[] = [];
      const res = executeAction(node, this.state.variables);
      if (res.modifiedKey) {
        executed.push(`Set ${res.modifiedKey} = ${String(res.newValue)}`);
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

    // Handle Condition node: evaluate expression and route accordingly
    if (node.type === "condition") {
      const passes = evaluateExpressionString(node.expression, this.state.variables);
      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        text: `Condition [${node.expression}] evaluated to ${passes ? "TRUE" : "FALSE"}`,
        timestamp: Date.now(),
      });

      // Advance: if passes, take outgoing connection; if not and multiple connections, take second or continue
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
        // Condition failed and no fallback path
        this.state.status = "ended";
      }
      return;
    }

    // Handle End node:
    if (node.type === "end") {
      this.state.status = "ended";
      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        text: node.label || "Conversation ended",
        timestamp: Date.now(),
      });
      return;
    }

    // Handle Dialogue node:
    if (node.type === "dialogue") {
      const speaker = this.resolveSpeaker(node.speakerId);
      this.state.currentSpeakerName = speaker || "Narrator";

      this.executeNodeActions(node);

      this.state.history.push({
        stepIndex: this.state.history.length,
        nodeId: node.id,
        nodeType: node.type,
        speakerName: speaker || "Narrator",
        speakerId: node.speakerId,
        text: node.dialogueText,
        menuText: node.menuText,
        timestamp: Date.now(),
      });

      // Check if subsequent nodes are player choices
      const outgoing = this.getValidOutgoing(node.id);
      const playerChoices: SimulationChoice[] = [];

      for (const targetId of outgoing) {
        const targetNode = this.conversation.nodes.find((n) => n.id === targetId);
        if (targetNode && targetNode.type === "player_response") {
          playerChoices.push({
            targetNodeId: targetNode.id,
            menuText: targetNode.menuText || targetNode.responseText,
            responseText: targetNode.responseText,
            speakerId: targetNode.speakerId,
          });
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

    // Any other node type
    this.advanceFromNode(node.id);
  }

  private advanceFromNode(nodeId: string): void {
    const validTargets = this.getValidOutgoing(nodeId);

    if (validTargets.length === 0) {
      this.state.status = "ended";
      return;
    }

    // Check if targets are player response choices
    const choiceTargets: SimulationChoice[] = [];
    for (const tId of validTargets) {
      const tNode = this.conversation.nodes.find((n) => n.id === tId);
      if (tNode && tNode.type === "player_response") {
        choiceTargets.push({
          targetNodeId: tNode.id,
          menuText: tNode.menuText || tNode.responseText,
          responseText: tNode.responseText,
          speakerId: tNode.speakerId,
        });
      }
    }

    if (choiceTargets.length > 0) {
      this.state.status = "waiting_for_choice";
      this.state.availableChoices = choiceTargets;
      return;
    }

    // Otherwise, transition to the first target node
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

  private resolveSpeaker(speakerId?: string | null): string {
    if (!speakerId) return "";
    const actor = this.project.actors.find((a) => a.id === speakerId);
    return actor ? actor.name : "";
  }
}
