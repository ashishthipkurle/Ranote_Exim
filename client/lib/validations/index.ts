import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  role: z.enum(['USER', 'CONSUMER', 'EXPORTER', 'IMPORTER', 'SUPPLIER']).default('IMPORTER'),
  businessName: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// User Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Product Schema
export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  category: z.enum([
    'CHEMICALS',
    'MACHINES',
    'TEXTILES',
    'MEDICAL',
    'HANDICRAFTS',
    'FOOD',
    'ELECTRONICS',
    'AUTOMOTIVE',
    'CONSTRUCTION',
    'AGRICULTURE',
    'COSMETICS',
    'PLASTICS',
    'ENERGY',
    'LOGISTICS',
    'PACKAGING',
    'METALS',
    'LEATHER',
    'FURNITURE',
    'TOYS',
    'SPORTS',
    'OTHER',
  ]),
  subCategory: z.string().optional(),
  company: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  regularPrice: z.number().min(0, 'Regular price must be non-negative').default(0),
  currency: z.string().optional().default("USD"),
  minOrderQty: z.number().int().positive('Minimum order quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  originCountry: z.string().min(2, 'Origin country is required'),
  hsCode: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),

  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  available: z.boolean().optional().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

// Order Schema
export const orderSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

// Message Schema
export const messageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  orderId: z.string().uuid().optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  content: z.string().min(1, 'Message content is required'),
});

export type MessageInput = z.infer<typeof messageSchema>;
