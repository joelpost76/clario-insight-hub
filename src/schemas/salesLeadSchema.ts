import { z } from 'zod';
import { PAIN_POINTS } from '@/types/salesLead';

export const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name required').max(100),
  industry: z.enum(['residential_design_build', 'commercial_construction', 'remodeling', 'mixed', 'other', '']).optional(),
  revenueRange: z.enum(['under_1m', '1m-5m', '5m-10m', '10m-25m', '25m_plus', '']).optional(),
  headcount: z.preprocess(
    (val) => (val === '' || val === undefined || Number.isNaN(val) ? undefined : Number(val)),
    z.number().positive().int().optional()
  ),
});

export const painPointsSchema = z.object({
  painPoints: z.array(z.enum(PAIN_POINTS)).min(1, 'Select at least one').max(5, 'Select up to 5'),
  urgency: z.enum(['immediate', '1-3_months', '3-6_months', 'exploring'], {
    required_error: 'Please select your timeline',
  }),
});

export const contactInfoSchema = z.object({
  contactName: z.string().min(2, 'Name required').max(100),
  contactTitle: z.string().max(100).optional(),
  contactEmail: z.string().email('Valid email required').min(5).max(100),
  contactPhone: z.string().regex(/^[0-9+\-() ]*$/, 'Invalid phone format').max(20).optional().or(z.literal('')),
  referralSource: z.string().max(100).optional(),
  notes: z.string().max(1000, 'Max 1000 characters').optional(),
});

export const salesLeadInputSchema = z.object({
  ...companyInfoSchema.shape,
  ...painPointsSchema.shape,
  ...contactInfoSchema.shape,
  servicesSelected: z.array(z.any()).min(1).refine(
    (services) => services.some((s: any) => s.id === 'diagnostic' && s.selected),
    { message: 'Diagnostic must be selected' }
  ),
});
