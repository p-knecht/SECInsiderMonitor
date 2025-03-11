import * as z from 'zod';
import { UserRole } from '@prisma/client';

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Bitte aktuelles Passwort eingeben'),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Bitte E-Mail Adresse eingeben')
    .transform((email) => email.toLowerCase()),
});

export const SetUserPasswordSchema = z
  .object({
    userId: z.string(),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export const SetUserRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRole, {
    required_error: 'Bitte eine gültige Benutzerrolle auswählen',
  }),
});

export const DeleteUserSchema = z.object({
  userId: z.string(),
});

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Bitte aktuelles Passwort eingeben'),
    newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export const ResetPasswordSchema = z
  .object({
    token: z.string().uuid('Ungültiger Passwort-Reset-Token'),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export const LoginFormSchema = z.object({
  email: z
    .string()
    .email('Bitte E-Mail Adresse eingeben')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Bitte Passwort eingeben'),
});

export const RegisterFormSchema = z
  .object({
    email: z
      .string()
      .email('Bitte E-Mail Adresse eingeben')
      .transform((email) => email.toLowerCase()),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

// simplified date regex (days) for table filter
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const userTableParamatersSchema = z
  .object({
    page: z.string().regex(/^\d+$/, 'Page muss eine Zahl sein').optional(),
    pageSize: z.string().regex(/^\d+$/, 'PageSize muss eine Zahl sein').optional(),
    sort: z.enum(['email', 'emailVerified', 'createdAt', 'lastLogin', 'role']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    'filter[email]': z.union([z.string(), z.array(z.string())]).optional(),
    'filter[emailVerified]': z
      .union([z.enum(['true', 'false']), z.array(z.enum(['true', 'false']))])
      .optional(),
    'filter[createdAt][from]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[createdAt][to]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[lastLogin][from]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[lastLogin][to]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[role]': z.union([z.nativeEnum(UserRole), z.array(z.nativeEnum(UserRole))]).optional(),
  })
  .strict();

export const filingsTableParamatersSchema = z
  .object({
    page: z.string().regex(/^\d+$/, 'Page muss eine Zahl sein').optional(),
    pageSize: z.string().regex(/^\d+$/, 'PageSize muss eine Zahl sein').optional(),
    sort: z
      .enum(['filingId', 'formType', 'periodOfReport', 'issuer', 'reportingOwner', 'dateFiled'])
      .optional(),
    order: z.enum(['asc', 'desc']).optional(),
    'filter[filingId]': z.union([z.string(), z.array(z.string())]).optional(),
    'filter[formType]': z
      .union([z.enum(['3', '4', '5']), z.array(z.enum(['3', '4', '5']))])
      .optional(),
    'filter[periodOfReport][from]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[periodOfReport][to]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[issuer]': z.union([z.string(), z.array(z.string())]).optional(),
    'filter[reportingOwner]': z.union([z.string(), z.array(z.string())]).optional(),
    'filter[dateFiled][from]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
    'filter[dateFiled][to]': z
      .string()
      .regex(dateRegex, 'Datum muss im Format YYYY-MM-DD sein')
      .optional(),
  })
  .strict();

export const SearchCiksSchema = z.object({
  searchString: z.string(),
  limit: z.number().int().positive(),
});

export const LookupCikSchema = z.object({
  cik: z.string().regex(/^\d{10}$/, 'Ungültiges CIK-Format'),
});

export const AnalysisSchema = z
  .object({
    cik: z.string().regex(/^\d{10}$/, 'Ungültiges CIK-Format'),
    depth: z.coerce
      .number()
      .int('Ungültige Zahl')
      .positive('Ungültige Zahl')
      .max(5, 'Maximum: 5')
      .min(1, 'Minimum: 1')
      .optional(),
    from: z.string().regex(dateRegex, 'Ungültiges Datumsformat'),
    to: z.string().regex(dateRegex, 'Ungültiges Datumsformat'),
  })
  .strict();

export const GetFilingSchema = z.object({
  filingId: z.string().regex(/^\d{10}-\d{2}-\d{6}$/, 'Ungültige filingId'),
});

export const GetEmbeddedDocumentContentSchema = z.object({
  filingId: z.string().regex(/^\d{10}-\d{2}-\d{6}$/, 'Ungültige filingId'),
  sequence: z.number().int().positive(),
});

export const LogfileSchema = z
  .string()
  .trim()
  .regex(/^datafetcher-\d{4}-\d{2}-\d{2}\.log$/, 'Ungültiges Logfile-Format');
