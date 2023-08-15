import { Module } from "@nestjs/common"
import { FriendInvitationsController } from "./friend-invitations.controller"
import { FriendInvitationsService } from "./friend-invitations.service"
import { UserModule } from "src/user/user.module"
import { SseModule } from "src/sse/sse.module"
import { FriendsModule } from "src/friends/friends.module"
import { Reflector } from "@nestjs/core"

@Module({
	imports: [UserModule, SseModule, FriendsModule, Reflector],
	controllers: [FriendInvitationsController],
	providers: [FriendInvitationsService],
})
export class FriendInvitationsModule {}
