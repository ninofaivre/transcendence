import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClientExceptionFilter } from './exception-filter';

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService]
})
export class PrismaModule {}
