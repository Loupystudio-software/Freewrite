import { z } from "zod";

export const ActorSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  name: z.string().min(1),
  description: z.string().default(""),
  isPlayer: z.boolean().default(false),
  portrait: z.string().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});

export type Actor = z.infer<typeof ActorSchema>;
