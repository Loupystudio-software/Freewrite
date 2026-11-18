import { z } from "zod";
import { ActorSchema } from "./actor.js";
import { ConversationSchema } from "./conversation.js";
import { VariableSchema } from "./variable.js";

export const ProjectSchema = z.object({
  format: z.literal("freewrite"),
  schemaVersion: z.literal("1.0.0"),
  project: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().default(""),
    author: z.string().default(""),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  actors: z.array(ActorSchema).default([]),
  conversations: z.array(ConversationSchema).default([]),
  variables: z.array(VariableSchema).default([]),
  items: z.array(z.unknown()).default([]),
  locations: z.array(z.unknown()).default([]),
  metadata: z.object({
    applicationVersion: z.string(),
    exportSettings: z.record(z.unknown()).default({}),
  }),
});

export type Project = z.infer<typeof ProjectSchema>;
