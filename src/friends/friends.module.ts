import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { AppService } from 'src/app.service';
import { SseModule } from 'src/sse/sse.module';

@Module({
  imports: [SseModule],
  providers: [FriendsService, AppService],
  controllers: [FriendsController]
})
export class FriendsModule {}
