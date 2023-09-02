import { Controller, UseGuards } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from 'contract';
import { GameService } from './game.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

const c = contract.game

@TsRest({ jsonQuery: true })
@Controller()
export class GameController {
    
    constructor(
        private readonly gameService: GameService
    ) {}
    
    @UseGuards(JwtAuthGuard)
    @TsRestHandler(c)
    async handler() {
        return tsRestHandler(c, {
            getMatchHistory: async ({ query, params }) => {
                const res = await this.gameService
                    .getMatchHistory(query.nMatches, params.username, query.cursor)
                return { status: 200, body: res }
            }
        })
    }


}
