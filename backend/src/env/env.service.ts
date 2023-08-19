import { Injectable } from '@nestjs/common';
import { z } from 'zod';

require("dotenv").config()

const zPassword = z.string().min(8)

const envSchema = z.object({
    JWT_SECRET: zPassword,

    PROFILE_PICTURE_DIR: z.string(),
    PROFILE_PICTURE_MAX_SIZE_MB: z.coerce.number().min(0.5).max(50).default(8),

    DATABASE_URL: z.string().url(),
    PUBLIC_BACKEND_PORT: z.coerce.number().min(1024).max(49151),

    PUBLIC_API42_CLIENT_ID: z.string(),
    PUBLIC_API42_REDIRECT_URI: z.string(),
    API42_CLIENT_SECRET: z.string()
})

@Injectable()
export class EnvService
{
    public static env = envSchema.parse(process.env)
}
