import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameMoovement } from 'contract';
import { GameWebsocketGateway, IntraUserName } from 'src/websocket/game.websocket.gateway';

interface Position {
    x: number
    y: number
}

class Player {

    private moovement: GameMoovement = "NONE";

    constructor(
        private readonly intraName: IntraUserName,
        private readonly game: Game,
        private position: Position
    ) {}

}

class Game {

    public readonly id: string;

    private readonly score: number = 0;

    private status: 'PAUSE' | 'PLAY' = 'PAUSE'

    private readonly playerA: Player;
    private readonly playerB: Player;

    constructor(
        playerAname: IntraUserName,
        playerBname: IntraUserName
    ) {
        this.id = `${playerAname}${playerBname}`
        this.playerA = new Player(playerAname, this, { x: 0, y: 400 })
        this.playerB = new Player(playerBname, this, { x: 1000, y: 400 })
    }

}

@Injectable()
export class GameService {

    private queue: IntraUserName | null = null;
    private games = new Map<string, Game>();
    private usersToGame = new Map<string, Game>();

    constructor(
        @Inject(forwardRef(() => GameWebsocketGateway))
        private readonly webSocket: GameWebsocketGateway
    ) {}

    public disconnectUser(username: IntraUserName) {
        if (this.queue === username)
            this.queue = null
    }

    public connectUser(username: IntraUserName) {
        // reconnect user to game after lost connection
    }

    public getGameIdForUser(username: IntraUserName) {
        return this.usersToGame.get(username)?.id
    }

    private async createGame(userOne: IntraUserName, userTwo: IntraUserName) {
        console.log("createGame")
        const newGame = new Game(userOne, userTwo)
        this.games.set(newGame.id, newGame)
        this.usersToGame.set(userOne, newGame)
        this.usersToGame.set(userTwo, newGame)
        this.webSocket.clientInGame(userOne, newGame.id)
        this.webSocket.clientInGame(userTwo, newGame.id)
        this.webSocket.emitEventToGame(newGame.id, 'found game')
    }

    public queueUser(username: IntraUserName) {
        if (this.queue === username)
            return
        if (!this.queue) {
            this.queue = username
            return
        }
        const opponent = this.queue
        this.queue = null
        this.createGame(opponent, username)
    }

    public deQueueUser(username: IntraUserName) {
        if (this.queue === username)
            this.queue = null
    }

}
