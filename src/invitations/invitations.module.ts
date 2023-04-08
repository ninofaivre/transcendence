import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AppService } from 'src/app.service';
import { ChansModule } from 'src/chans/chans.module';
import { SseModule } from 'src/sse/sse.module';

@Module({
  imports: [ChansModule, SseModule],
  providers: [InvitationsService, AppService],
  controllers: [InvitationsController]
})
export class InvitationsModule {}
