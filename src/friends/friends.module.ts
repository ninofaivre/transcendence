import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { AppService } from 'src/app.service';

@Module({
  providers: [FriendsService, AppService],
  controllers: [FriendsController]
})
export class FriendsModule {}
