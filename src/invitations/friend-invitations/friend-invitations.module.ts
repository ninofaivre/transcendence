import { Module } from '@nestjs/common';
import { FriendInvitationsController } from './friend-invitations.controller';
import { FriendInvitationsService } from './friend-invitations.service';
import { CaslModule } from 'src/casl/casl.module';
import { UserModule } from 'src/user/user.module';
import { SseModule } from 'src/sse/sse.module';
import { FriendsModule } from 'src/friends/friends.module';

@Module
({
	imports: [CaslModule, UserModule, SseModule, FriendsModule],
	controllers: [FriendInvitationsController],
	providers: [FriendInvitationsService]
})
export class FriendInvitationsModule {}
