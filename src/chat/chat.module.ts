import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DiscussionsService } from './discussions.service';
import { MessagesService } from './messages.service';

@Module({
	imports: [forwardRef(() => UserModule)],
	controllers: [ChatController],
	providers: [ ChatService, MessagesService, DiscussionsService],
	exports: [ChatService]
})
export class ChatModule {}
