import { z } from "zod/v4";
import { NextResponse } from "next/server";

export const createMemberSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.email("Ungültige E-Mail-Adresse"),
  role: z.enum(["admin", "member"]).default("member"),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  licenses: z
    .array(
      z.object({
        licenseClassId: z.string(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
        checkIntervalMonths: z.number().int().positive().default(6),
        restriction188: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createCheckSchema = z.object({
  userId: z.string(),
  checkType: z.enum(["photo_upload", "in_person"]),
  result: z.enum(["pending", "approved", "rejected"]).default("pending"),
  notes: z.string().optional(),
});

export const updateCheckSchema = z.object({
  result: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSettingsSchema = z.record(z.string(), z.string());

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
});

export const consentSchema = z.object({
  dataProcessing: z.boolean(),
  emailNotifications: z.boolean().optional(),
  photoUpload: z.boolean().optional(),
  policyVersion: z.string(),
});

export function validateBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
):
  | { success: true; data: T; response?: undefined }
  | { success: false; data?: undefined; response: NextResponse } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Validierungsfehler", details: err.issues },
          { status: 400 },
        ),
      };
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Ungültiger Request-Body" },
        { status: 400 },
      ),
    };
  }
}
