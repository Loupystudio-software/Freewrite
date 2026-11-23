import { z } from "zod";

export const CustomFieldTypeSchema = z.enum([
  "Text",
  "Number",
  "Boolean",
  "Files",
  "Actor",
  "Item",
  "Location",
]);

export type CustomFieldType = z.infer<typeof CustomFieldTypeSchema>;

export const CustomFieldSchema = z.object({
  title: z.string().min(1),
  type: CustomFieldTypeSchema.default("Text"),
  value: z.string().default(""),
});

export type CustomField = z.infer<typeof CustomFieldSchema>;
