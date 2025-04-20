import * as z from 'zod';
import { UserRole } from '@prisma/client';

/*//
// This file contains the schemas used to validate the requests form the clients (especially requests to Server Actions to prevent malicious or malformed requests)
//*/

/**
 * Schema used to validate request when deleting the own user account
 */
export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Bitte aktuelles Passwort eingeben'),
});

/**
 * Schema used to validate request when sending a password reset request
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Bitte E-Mail Adresse eingeben')
    .transform((email) => email.toLowerCase()),
  requestTimeZone: z.string().optional(),
});

/**
 * Schema used to validate request  when setting a new password for a user (as admin)
 */
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

/**
 * Schema used to validate request when setting a new role for a user (as admin)
 */
export const SetUserRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRole, {
    required_error: 'Bitte eine gültige Benutzerrolle auswählen',
  }),
});

/**
 * Schema used to validate request when deleting a user (as admin)
 */
export const DeleteUserSchema = z.object({
  userId: z.string(),
});

/**
 * Schema used to validate request when changing the own password
 */
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

/**
 * Schema used to validate request when resetting the own password using a password reset token
 */
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

/**
 * Schema used to validate request when logging in
 */
export const LoginFormSchema = z.object({
  email: z
    .string()
    .email('Bitte E-Mail Adresse eingeben')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Bitte Passwort eingeben'),
  requestTimeZone: z.string().optional(),
});

/**
 * Schema used to validate request when registering a new user
 */
export const RegisterFormSchema = z
  .object({
    email: z
      .string()
      .email('Bitte E-Mail Adresse eingeben')
      .transform((email) => email.toLowerCase()),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    confirmPassword: z.string(),
    requestTimeZone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

// simplified date regex (days) used for table filters
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema used to validate request when loading a page of the user table (with potential sorting and filtering)
 */
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

/**
 * Schema used to validate request when loading a page of the filings table (with potential sorting and filtering)
 */
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

/**
 * Schema used to validate request when searching for CIKs (with a search string)
 */
export const SearchCiksSchema = z.object({
  searchString: z.string(),
  limit: z.number().int().positive(),
  limitType: z.enum(['issuer', 'reportingOwner']).optional(),
});

/**
 * Schema used to validate request when searching for specific CIK (--> lookup)
 */
export const LookupCikSchema = z.object({
  cik: z.string().regex(/^\d{10}$/, 'Ungültiges CIK-Format'),
});

/**
 * Schema used to validate request when asking for a company or network analysis
 */
export const AnalysisSchema = z
  .object({
    cik: z.string().regex(/^\d{10}$/, 'Ungültige Entität'),
    depth: z.coerce
      .number()
      .int('Ungültige Zahl')
      .positive('Ungültige Zahl')
      .max(10, 'Maximum: 10')
      .min(1, 'Minimum: 1')
      .optional(),
    from: z.string().regex(dateRegex, 'Ungültiges Datumsformat'),
    to: z.string().regex(dateRegex, 'Ungültiges Datumsformat'),
  })
  .strict();

/**
 * Schema used to validate request when asking for a specific filing
 */
export const GetFilingSchema = z.object({
  filingId: z.string().regex(/^\d{10}-\d{2}-\d{6}$/, 'Ungültige filingId'),
});

/**
 * Schema used to validate request when asking for the content of an embedded document
 */
export const GetEmbeddedDocumentContentSchema = z.object({
  filingId: z.string().regex(/^\d{10}-\d{2}-\d{6}$/, 'Ungültige filingId'),
  sequence: z.number().int().positive(),
});

/**
 * Schema used to validate the name of a datafetcher-logfile
 */
export const LogfileSchema = z
  .string()
  .trim()
  .regex(/^datafetcher(_\d{4}-\d{2}-\d{2})?\.log$/, 'Ungültiges Logfile-Format');

/**
 * Schema used to validate request when creating a new notification subscription
 */
export const NotificationSubscriptionSchema = z
  .object({
    description: z.string().min(1, 'Bitte Beschreibung erfassen'),
    issuerCiks: z.array(z.string().regex(/^\d{10}$/, 'Ungültige Entität')).optional(),
    formTypes: z.array(z.enum(['3', '4', '5'])).optional(),
    reportingOwnerCiks: z.array(z.string().regex(/^\d{10}$/, 'Ungültige Entität')).optional(),
  })
  .refine(
    (data) => (data.issuerCiks?.length || 0) > 0 || (data.reportingOwnerCiks?.length || 0) > 0,
    {
      message: 'Mindestens ein Issuer oder ein Reporting Owner muss angegeben werden.',
      path: ['issuerCiks'], // Hier wird der Fehler standardmäßig an `issuerCiks` gehängt
    },
  );

/**
 * Schema used to validate request when deleting a notification subscription
 */
export const DeleteNotificationSubscriptionSchema = z.object({
  subscriptionId: z.string(),
});

/**
 * Schema used to validate selected timeframe for the dashboard
 * (number of days to look back for the filing analysis)
 */
export const DashboardTimeframeFilterSchema = z
  .number()
  .int()
  .min(1, {
    message: 'Die Anzahl der Tage muss mindestens 1 betragen.',
  })
  .max(365, {
    message: 'Die Anzahl der Tage darf maximal 365 betragen.',
  });
