import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma.service'
import { UsersModule} from '../users/users.module'

@Module({
	imports: [forwardRef(() => UsersModule)],
	providers: [MessagesService, PrismaService],
	exports: [MessagesService]
})
export class MessagesModule {}
