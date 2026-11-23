import { z } from "zod";
import { CustomFieldSchema } from "./customField.js";

export const ItemQuestStateEnum = z.enum([
  "unassigned",
  "active",
  "success",
  "failure",
  "abandoned",
]);
export type ItemQuestState = z.infer<typeof ItemQuestStateEnum>;

export const ItemSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  name: z.string().min(1),
  isItem: z.boolean().default(false), // true = Item, false = Quest
  state: ItemQuestStateEnum.default("unassigned"),
  description: z.string().default(""),
  successDescription: z.string().default(""),
  failureDescription: z.string().default(""),
  fields: z.array(CustomFieldSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Item = z.infer<typeof ItemSchema>;
