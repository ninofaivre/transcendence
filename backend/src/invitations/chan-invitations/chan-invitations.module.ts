import { Module, forwardRef } from "@nestjs/common"
import { ChanInvitationsService } from "./chan-invitations.service"
import { ChanInvitationsController } from "./chan-invitations.controller"
import { UserModule } from "src/user/user.module"
import { SseModule } from "src/sse/sse.module"
import { DmsModule } from "src/dms/dms.module"
import { ChansModule } from "src/chans/chans.module"
import { Reflector } from "@nestjs/core"

@Module({
	imports: [forwardRef(() => UserModule), SseModule, DmsModule, forwardRef(() => ChansModule), Reflector],
	providers: [ChanInvitationsService],
	controllers: [ChanInvitationsController],
	exports: [ChanInvitationsService],
})
export class ChanInvitationsModule {}
