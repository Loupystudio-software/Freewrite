import { z } from "zod";
import { CustomFieldSchema } from "./customField.js";

export const DocumentCategorySchema = z.enum([
  "gdd",
  "lore",
  "screenplay",
  "quest_brief",
  "notes",
  "other",
]);

export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;

export const DocumentSectionTypeSchema = z.enum([
  "text",
  "todo",
  "table",
  "screenplay",
  "callout",
]);

export type DocumentSectionType = z.infer<typeof DocumentSectionTypeSchema>;

export const DocumentSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().default("Untitled Section"),
  level: z.number().int().min(1).max(3).default(1),
  type: DocumentSectionTypeSchema.default("text"),
  content: z.string().default(""),
  collapsed: z.boolean().default(false),
  linkedEntityIds: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type DocumentSection = z.infer<typeof DocumentSectionSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  title: z.string().min(1),
  category: DocumentCategorySchema.default("gdd"),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  sections: z.array(DocumentSectionSchema).default([]),
  fields: z.array(CustomFieldSchema).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type NarrativeDocument = z.infer<typeof DocumentSchema>;
