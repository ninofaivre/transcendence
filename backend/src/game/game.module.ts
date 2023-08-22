import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameWebsocketModule } from 'src/websocket/game.websocket.module';

@Module({
    imports: [forwardRef(() => GameWebsocketModule)],
    providers: [GameService],
    exports: [GameService]
})
export class GameModule {}
