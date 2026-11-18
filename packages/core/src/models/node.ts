import { z } from "zod";

const BaseNodeSchema = z.object({
  id: z.string().uuid(),
  position: z.object({ x: z.number(), y: z.number() }),
  metadata: z.record(z.unknown()).default({}),
});

export const StartNodeSchema = BaseNodeSchema.extend({
  type: z.literal("start"),
  label: z.string().default(""),
});

export const DialogueNodeSchema = BaseNodeSchema.extend({
  type: z.literal("dialogue"),
  speakerId: z.string().uuid().nullable().default(null),
  menuText: z.string().default(""),
  dialogueText: z.string().default(""),
  conditions: z.array(z.unknown()).default([]),
  actions: z.array(z.unknown()).default([]),
});

export const PlayerResponseNodeSchema = BaseNodeSchema.extend({
  type: z.literal("player_response"),
  speakerId: z.string().uuid().nullable().default(null),
  responseText: z.string().default(""),
  menuText: z.string().default(""),
  conditions: z.array(z.unknown()).default([]),
  actions: z.array(z.unknown()).default([]),
});

export const ConditionNodeSchema = BaseNodeSchema.extend({
  type: z.literal("condition"),
  expression: z.string().default(""),
});

export const ActionNodeSchema = BaseNodeSchema.extend({
  type: z.literal("action"),
  actionType: z.string().default(""),
  parameters: z.record(z.unknown()).default({}),
});

export const EndNodeSchema = BaseNodeSchema.extend({
  type: z.literal("end"),
  label: z.string().default(""),
});

export const CommentNodeSchema = BaseNodeSchema.extend({
  type: z.literal("comment"),
  text: z.string().default(""),
});

export const DialogueNodeUnionSchema = z.discriminatedUnion("type", [
  StartNodeSchema,
  DialogueNodeSchema,
  PlayerResponseNodeSchema,
  ConditionNodeSchema,
  ActionNodeSchema,
  EndNodeSchema,
  CommentNodeSchema,
]);

export type StartNode = z.infer<typeof StartNodeSchema>;
export type DialogueNode = z.infer<typeof DialogueNodeSchema>;
export type PlayerResponseNode = z.infer<typeof PlayerResponseNodeSchema>;
export type ConditionNode = z.infer<typeof ConditionNodeSchema>;
export type ActionNode = z.infer<typeof ActionNodeSchema>;
export type EndNode = z.infer<typeof EndNodeSchema>;
export type CommentNode = z.infer<typeof CommentNodeSchema>;
export type AnyDialogueNode = z.infer<typeof DialogueNodeUnionSchema>;
