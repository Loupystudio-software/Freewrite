export interface DialogueSystemCSVDatabase {
  name: string;
  version: string;
  author: string;
  description: string;
  globalUserScript?: string;
}

export interface DialogueSystemCSVActor {
  id: number;
  name: string;
  description: string;
  isPlayer: boolean;
  portrait?: string;
}

export interface DialogueSystemCSVItem {
  id: number;
  name: string;
  description: string;
  isItem?: boolean;
}

export interface DialogueSystemCSVLocation {
  id: number;
  name: string;
  description: string;
}

export interface DialogueSystemCSVVariable {
  id: number;
  name: string;
  initialValue: string | number | boolean;
  type: "Boolean" | "Number" | "Text";
  description: string;
}

export interface DialogueSystemCSVConversation {
  id: number;
  title: string;
  description: string;
  actorId?: number;
  conversantId?: number;
}

export interface DialogueSystemCSVDialogueEntry {
  convId: number;
  id: number;
  actor: number;
  conversant: number;
  menuText: string;
  dialogueText: string;
  isGroup: boolean;
  falseConditionAction: number;
  conditionPriority: number;
  conditions: string;
  script: string;
  sequence: string;
  canvasRect?: string; // "x;y" or "x;y;w;h"
}

export interface DialogueSystemCSVOutgoingLink {
  originConvId: number;
  originId: number;
  destConvId: number;
  destId: number;
  isConnector: boolean;
  priority: number;
}
