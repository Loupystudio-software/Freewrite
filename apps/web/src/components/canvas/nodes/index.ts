import type { NodeTypes } from "@xyflow/react";
import { StartNodeComponent } from "./StartNode";
import { DialogueNodeComponent } from "./DialogueNode";
import { PlayerResponseNodeComponent } from "./PlayerResponseNode";
import { ConditionNodeComponent } from "./ConditionNode";
import { ActionNodeComponent } from "./ActionNode";
import { EndNodeComponent } from "./EndNode";
import { CommentNodeComponent } from "./CommentNode";

export const nodeTypes: NodeTypes = {
  start: StartNodeComponent,
  dialogue: DialogueNodeComponent,
  player_response: PlayerResponseNodeComponent,
  condition: ConditionNodeComponent,
  action: ActionNodeComponent,
  end: EndNodeComponent,
  comment: CommentNodeComponent,
};
