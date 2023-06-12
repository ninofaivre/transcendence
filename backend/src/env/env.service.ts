import { Injectable } from '@nestjs/common';
import { z } from 'zod';

require("dotenv").config()

const envSchema = z.object({
    JWT_SECRET: z.string().nonempty(),
    DATABASE_URL: z.string().url()
})

@Injectable()
export class EnvService
{
    public static env = envSchema.parse(process.env)
}
