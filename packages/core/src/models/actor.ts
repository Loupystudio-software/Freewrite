import { z } from "zod";
import { CustomFieldSchema } from "./customField.js";

export const ActorSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  name: z.string().min(1),
  description: z.string().default(""),
  isPlayer: z.boolean().default(false),
  pictures: z.array(z.string()).default([]),
  portrait: z.string().nullable().default(null),
  color: z.string().default("#3b82f6"),
  fields: z.array(CustomFieldSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Actor = z.infer<typeof ActorSchema>;
