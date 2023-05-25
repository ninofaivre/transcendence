import { Controller } from '@nestjs/common';
import { NestControllerInterface, NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';

const c = nestControllerContract(contract.invitations.chan)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
export class ChanInvitationsController implements NestControllerInterface<typeof c>
{}
