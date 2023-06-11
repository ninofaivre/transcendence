import { Module } from "@nestjs/common"
import { AppService } from "src/app.service"
import { ChansModule } from "src/chans/chans.module"
import { SseModule } from "src/sse/sse.module"
import { ChanInvitationsModule } from "./chan-invitations/chan-invitations.module"
import { FriendInvitationsModule } from "./friend-invitations/friend-invitations.module"
import { UserModule } from "src/user/user.module"

@Module({
	imports: [ChansModule, SseModule, ChanInvitationsModule, FriendInvitationsModule, UserModule],
	providers: [AppService],
})
export class InvitationsModule {}
