import { Module, forwardRef } from "@nestjs/common"
import { UserService } from "./user.service"
import { UserController } from "./user.controller"
import { SseModule } from "src/sse/sse.module"
import { ChansModule } from "src/chans/chans.module"
import { FriendsModule } from "src/friends/friends.module"
import { DmsModule } from "src/dms/dms.module"

@Module({
	imports: [forwardRef(() => SseModule), ChansModule, forwardRef(() => FriendsModule), DmsModule],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService],
})
export class UserModule {}
