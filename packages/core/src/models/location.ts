import { z } from "zod";
import { CustomFieldSchema } from "./customField.js";

export const LocationElementTypeSchema = z.enum([
  "zone_rect",
  "zone_circle",
  "zone_polygon",
  "path",
  "spot",
  "link",
  "image",
]);

export type LocationElementType = z.infer<typeof LocationElementTypeSchema>;

export const LocationPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type LocationPoint = z.infer<typeof LocationPointSchema>;

export const LocationLinkedEntityTypeSchema = z.enum([
  "none",
  "location",
  "conversation",
  "actor",
  "item",
  "document",
]);

export type LocationLinkedEntityType = z.infer<
  typeof LocationLinkedEntityTypeSchema
>;

export const LocationElementSchema = z.object({
  id: z.string().uuid(),
  type: LocationElementTypeSchema,
  name: z.string().default("Element"),
  description: z.string().default(""),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(180),
  height: z.number().default(120),
  points: z.array(LocationPointSchema).default([]),
  color: z.string().default("#3b82f6"),
  opacity: z.number().min(0).max(1).default(0.35),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  zIndex: z.number().int().default(0),
  imageUrl: z.string().default(""),
  linkedEntityType: LocationLinkedEntityTypeSchema.default("none"),
  linkedEntityId: z.string().nullable().default(null),
  fields: z.array(CustomFieldSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type LocationElement = z.infer<typeof LocationElementSchema>;

export const LocationSchema = z.object({
  id: z.string().uuid(),
  externalId: z.number().int().optional().nullable(),
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().default(null),
  description: z.string().default(""),
  color: z.string().default("#60a5fa"),
  backgroundColor: z.string().default("#16181d"),
  elements: z.array(LocationElementSchema).default([]),
  fields: z.array(CustomFieldSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type Location = z.infer<typeof LocationSchema>;
