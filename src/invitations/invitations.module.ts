import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AppService } from 'src/app.service';
import { ChansModule } from 'src/chans/chans.module';

@Module({
  imports: [ChansModule],
  providers: [InvitationsService, AppService],
  controllers: [InvitationsController]
})
export class InvitationsModule {}
