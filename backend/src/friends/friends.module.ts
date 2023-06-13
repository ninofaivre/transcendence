import { Module, forwardRef } from "@nestjs/common"
import { FriendsService } from "./friends.service"
import { FriendsController } from "./friends.controller"
import { AppService } from "src/app.service"
import { SseModule } from "src/sse/sse.module"
import { DmsModule } from "src/dms/dms.module"
import { ChansModule } from "src/chans/chans.module"
import { UserModule } from "src/user/user.module"

@Module({
	imports: [SseModule, DmsModule, forwardRef(() => ChansModule), forwardRef(() => UserModule)],
	providers: [FriendsService, AppService],
	controllers: [FriendsController],
	exports: [FriendsService],
})
export class FriendsModule {}
