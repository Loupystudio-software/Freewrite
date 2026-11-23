import { z } from "zod";
import { DialogueNodeUnionSchema, DialogueNodePrioritySchema } from "./node.js";
import { ConnectionSchema } from "./connection.js";
import { CustomFieldSchema } from "./customField.js";

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  title: z.string().min(1),
  description: z.string().default(""),
  actorId: z.string().uuid().nullable().default(null),
  conversantId: z.string().uuid().nullable().default(null),
  priority: DialogueNodePrioritySchema.default("Normal"),
  startNodeId: z.string().uuid().nullable().default(null),
  nodes: z.array(DialogueNodeUnionSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  fields: z.array(CustomFieldSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Conversation = z.infer<typeof ConversationSchema>;
