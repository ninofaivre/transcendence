import { PrismaService } from "nestjs-prisma"

export type Tx = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">
