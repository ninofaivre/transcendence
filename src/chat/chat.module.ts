import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DiscussionsService } from './discussions.service';
import { MessagesService } from './messages.service';

@Module({
	imports: [UsersModule],
	controllers: [ChatController],
	providers: [PrismaService, ChatService, MessagesService, DiscussionsService]
})
export class ChatModule {}
