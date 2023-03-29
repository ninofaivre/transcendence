import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AppService } from 'src/app.service';

@Module({
  providers: [InvitationsService, AppService],
  controllers: [InvitationsController]
})
export class InvitationsModule {}
