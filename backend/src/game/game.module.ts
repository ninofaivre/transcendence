import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameWebsocketModule } from 'src/websocket/game.websocket.module';
import { GameController } from './game.controller';

@Module({
    imports: [forwardRef(() => GameWebsocketModule)],
    providers: [GameService],
    exports: [GameService],
    controllers: [GameController]
})
export class GameModule {}
