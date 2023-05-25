import { Module } from '@nestjs/common';
import { ChanInvitationsService } from './chan-invitations.service';
import { ChanInvitationsController } from './chan-invitations.controller';

@Module({
  providers: [ChanInvitationsService],
  controllers: [ChanInvitationsController]
})
export class ChanInvitationsModule {}
