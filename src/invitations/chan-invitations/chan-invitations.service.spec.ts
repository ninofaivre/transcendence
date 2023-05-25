import { Test, TestingModule } from '@nestjs/testing';
import { ChanInvitationsService } from './chan-invitations.service';

describe('ChanInvitationsService', () => {
  let service: ChanInvitationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChanInvitationsService],
    }).compile();

    service = module.get<ChanInvitationsService>(ChanInvitationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
