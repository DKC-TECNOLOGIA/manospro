import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "required")
    .email("invalid_email"),
  password: z
    .string()
    .min(8, "min_password"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  role: z.enum(["client", "professional"]),
  fullName: z
    .string()
    .trim()
    .min(3, "min_name")
    .max(80, "max_name"),
  email: z
    .string()
    .trim()
    .email("invalid_email"),
  phone: z
    .string()
    .trim()
    .min(8, "invalid_phone")
    .max(25, "invalid_phone"),
  country: z.enum(["AR", "BR"]),
  city: z
    .string()
    .trim()
    .min(2, "required"),
  categorySlug: z.string().optional(),
  password: z
    .string()
    .min(8, "min_password"),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const quoteSimulationSchema = z.object({
  serviceType: z.string().trim().min(2, "required"),
  neighborhood: z.string().trim().min(2, "required"),
  description: z.string().trim().min(15, "min_description").max(600, "max_description"),
});

export type QuoteSimulationValues = z.infer<typeof quoteSimulationSchema>;
