import { z } from 'zod';

import { messages } from '@/config/messages';

// form zod validation schema
export const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(1, { message: messages.passwordRequired })
    .min(6, { message: messages.passwordLengthMin })
    .regex(new RegExp('.*[A-Z].*'), {
      message: messages.passwordOneUppercase,
    })
    .regex(new RegExp('.*[a-z].*'), {
      message: messages.passwordOneLowercase,
    })
    .regex(new RegExp('.*\\d.*'), { message: messages.passwordOneNumeric })    
  ,
  confirmPassword: z
    .string()
    .min(1, { message: messages.passwordRequired })
    .min(6, { message: messages.passwordLengthMin })
    .regex(new RegExp('.*[A-Z].*'), {
      message: messages.passwordOneUppercase,
    })
    .regex(new RegExp('.*[a-z].*'), {
      message: messages.passwordOneLowercase,
    })
    .regex(new RegExp('.*\\d.*'), { message: messages.passwordOneNumeric })
  ,
  token: z.string().min(1),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// generate form types from zod validation schema
export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
