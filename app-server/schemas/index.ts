import * as z from 'zod';

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Bitte aktuelles Passwort eingeben'),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Bitte E-Mail Adresse eingeben')
    .transform((email) => email.toLowerCase()),
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
