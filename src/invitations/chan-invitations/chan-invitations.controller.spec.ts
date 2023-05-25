import { Test, TestingModule } from '@nestjs/testing';
import { ChanInvitationsController } from './chan-invitations.controller';

describe('ChanInvitationsController', () => {
  let controller: ChanInvitationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChanInvitationsController],
    }).compile();

    controller = module.get<ChanInvitationsController>(ChanInvitationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
