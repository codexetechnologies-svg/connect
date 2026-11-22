import { z } from 'zod';

export const kycSubmissionSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(8, 'Provide a valid phone number.'),
  entityName: z.string().min(3, 'Please enter the company or shop name.'),
  role: z.enum(['supplier', 'medical-shop', 'admin']),
  documentType: z.enum(['wholesale-drug-license', 'retail-drug-license', 'gst']),
  consent: z.literal(true, { error: 'You must accept the terms and conditions.' })
});

export type KycSubmission = z.infer<typeof kycSubmissionSchema>;
