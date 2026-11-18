import { z } from "zod";

export const ConnectionSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  priority: z.number().int().default(0),
  conditions: z.array(z.unknown()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Connection = z.infer<typeof ConnectionSchema>;
