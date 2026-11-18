import { z } from "zod";
import { DialogueNodeUnionSchema } from "./node.js";
import { ConnectionSchema } from "./connection.js";

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  title: z.string().min(1),
  description: z.string().default(""),
  actorId: z.string().uuid().nullable().default(null),
  conversantId: z.string().uuid().nullable().default(null),
  startNodeId: z.string().uuid().nullable().default(null),
  nodes: z.array(DialogueNodeUnionSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Conversation = z.infer<typeof ConversationSchema>;
