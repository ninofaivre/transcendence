import { Module, forwardRef } from '@nestjs/common';
import { ChansService } from './chans.service';
import { ChansController } from './chans.controller';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { SseModule } from 'src/sse/sse.module';
import { CaslModule } from 'src/casl/casl.module';
import { UserModule } from 'src/user/user.module';
import { ChanInvitationsModule } from 'src/invitations/chan-invitations/chan-invitations.module';

@Module({
  imports: [SseModule, CaslModule, UserModule, forwardRef(() => ChanInvitationsModule)],
  controllers: [ChansController],
  providers: [ChansService, AppService, PermissionsService],
  exports: [PermissionsService, ChansService]
})
export class ChansModule {}
