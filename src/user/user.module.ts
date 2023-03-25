import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service'
import { ChatModule } from 'src/chat/chat.module';

@Module({
	imports: [ forwardRef(() => ChatModule)],
	providers: [UserService, PrismaService],
	controllers: [UserController],
	exports: [UserService]
})
export class UserModule {}
