import { z } from 'zod';
import {
  POST_TYPES,
  SEVERITIES,
  EMERGENCY_CATEGORIES,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  CURRENCIES,
  REPORT_REASONS,
  CONTACT_TYPES,
} from '@/types';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const placeSchema = z.object({
  label: z.string().trim().min(1).max(200),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  place: placeSchema,
});

const imageUrl = z
  .string()
  .url()
  .refine((url) => url.startsWith('https://res.cloudinary.com/'), 'Images must be uploaded through LocalVibe');

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 characters: letters, numbers or underscores');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().max(254).email('Enter a valid email'),
  password: passwordSchema,
  acceptTerms: z.literal(true, { message: 'You must accept the Terms and Community Guidelines' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: passwordSchema,
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  username: usernameSchema.optional(),
  bio: z.string().trim().max(300).optional(),
  image: imageUrl.nullable().optional(),
  location: locationSchema.nullable().optional(),
  preferences: z
    .object({
      radiusKm: z.number().int().min(1).max(500),
      emailNotifications: z.boolean(),
    })
    .partial()
    .optional(),
});

export const createPostSchema = z
  .object({
    type: z.enum(POST_TYPES),
    text: z.string().trim().min(1, 'Write something first').max(2000),
    images: z.array(imageUrl).max(4).default([]),
    tags: z
      .array(z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,24}$/))
      .max(5)
      .default([]),
    location: locationSchema,
    event: z
      .object({
        startsAt: z.coerce.date(),
        venue: optionalText(120),
      })
      .optional(),
    emergency: z
      .object({
        severity: z.enum(SEVERITIES),
        category: z.enum(EMERGENCY_CATEGORIES),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'event' && !data.event) {
      ctx.addIssue({ code: 'custom', path: ['event'], message: 'Events need a start date' });
    }
    if (data.type === 'emergency' && !data.emergency) {
      ctx.addIssue({ code: 'custom', path: ['emergency'], message: 'Emergency alerts need a category and severity' });
    }
  });

export const commentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const createListingSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(100),
  description: z.string().trim().min(10, 'Add a few more details').max(3000),
  price: z.number().min(0).max(100_000_000),
  currency: z.enum(CURRENCIES),
  category: z.enum(LISTING_CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS),
  images: z.array(imageUrl).min(1, 'Add at least one photo').max(6),
  location: locationSchema,
});

export const updateListingSchema = z.object({
  status: z.enum(['active', 'sold']),
});

export const startConversationSchema = z.object({
  recipientId: z.string().min(1),
  listingId: z.string().optional(),
  text: z.string().trim().min(1).max(2000),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const reportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'listing', 'user']),
  targetId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: optionalText(500),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9()\-\s]{3,25}$/, 'Enter a valid phone number'),
  type: z.enum(CONTACT_TYPES),
  description: optionalText(300),
  location: locationSchema,
});

export const adminReportActionSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(['dismiss', 'hide', 'hide_and_ban']),
});

export const adminContactActionSchema = z.object({
  contactId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
});
