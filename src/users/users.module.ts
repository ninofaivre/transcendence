import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service'
import { forwardRef } from '@nestjs/common'
import { DiscussionsModule } from '../discussions/discussions.module'
import { MessagesModule } from '../messages/messages.module'

@Module({
	imports: [forwardRef(() => DiscussionsModule), forwardRef(() => MessagesModule)],
	providers: [UsersService, PrismaService],
	controllers: [UsersController],
	exports: [UsersService]
})
export class UsersModule {}
