import { z } from "zod";

export const VariableSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  name: z.string().min(1),
  type: z.enum(["boolean", "number", "string"]),
  initialValue: z.union([z.boolean(), z.number(), z.string()]),
  description: z.string().default(""),
});

export type Variable = z.infer<typeof VariableSchema>;
