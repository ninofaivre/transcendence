import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module'
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { PrismaService } from '../prisma.service'

@Module({
	imports: [forwardRef(() => UsersModule)],
	controllers: [DiscussionsController],
	providers: [DiscussionsService, PrismaService],
	exports: [DiscussionsService]
})
export class DiscussionsModule {}
