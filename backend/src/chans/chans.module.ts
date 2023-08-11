import { Module, forwardRef } from "@nestjs/common"
import { ChansService } from "./chans.service"
import { ChansController } from "./chans.controller"
import { SseModule } from "src/sse/sse.module"
import { ChanInvitationsModule } from "src/invitations/chan-invitations/chan-invitations.module"
import { UserModule } from "src/user/user.module"
import { CallbackModule } from "src/callback/callback.module"

@Module({
	imports: [
        SseModule,
        CallbackModule,
        forwardRef(() => UserModule),
        forwardRef(() => ChanInvitationsModule),
    ],
	controllers: [ChansController],
	providers: [ChansService /* , AppService */],
	exports: [ChansService],
})
export class ChansModule {}
