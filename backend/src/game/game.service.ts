import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameDim, GameMoovement } from 'contract';
import { GameWebsocketGateway, IntraUserName } from 'src/websocket/game.websocket.gateway';

const tickRate = 128;

interface Position {
    x: number
    y: number
}

class Player {

    private pauseAmount = 60000
    private moovement: GameMoovement = "NONE";

    constructor(
        private readonly intraName: IntraUserName,
        private readonly game: Game,
        private position: Position
    ) {}

}

class Ball {

    constructor(
        private position: Position
    ) {}

}

class Game {

    public readonly id: string;

    private readonly score: number = 0;
    // private updateTime = 
    private status: 'INIT' | 'PAUSE' | 'PLAY' = 'PAUSE'

    private readonly playerA: Player;
    private readonly playerB: Player;
    private readonly ball: Ball = new Ball({
        x: GameDim.court.width / 2 - GameDim.ballRadius,
        y: GameDim.court.height / 2 - GameDim.ballRadius
    })

    constructor(
        playerAname: IntraUserName,
        playerBname: IntraUserName,
        private readonly webSocket: GameWebsocketGateway
    ) {
        this.id = `${playerAname}${playerBname}`
        this.playerA = new Player(playerAname, this, {
            x: 0,
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        })
        this.playerB = new Player(playerBname, this, {
            x: (GameDim.court.width - GameDim.paddle.width),
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        })
    }

    public init() {
        // this.webSocket.server.to(this.id).emit()
    }

    public pause() {
        if (this.status = 'INIT')
            // do something
        this.status = 'PAUSE'
    }

    public unpause() {
        // if (this.initCoolDown)
        //     this.status = 'INIT'
        // else
            this.status = 'PLAY'
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
        const game = this.usersToGame.get(username)
        if (!game)
            return
        game.pause()
    }

    public connectUser(username: IntraUserName) {
        const game = this.usersToGame.get(username)
        if (!game)
            return
        this.webSocket.clientInGame(username, game.id)
        game.unpause()
    }

    public getGameIdForUser(username: IntraUserName) {
        return this.usersToGame.get(username)?.id
    }

    private async createGame(userOne: IntraUserName, userTwo: IntraUserName) {
        console.log("createGame")
        const newGame = new Game(userOne, userTwo, this.webSocket)
        this.games.set(newGame.id, newGame)
        this.webSocket.clientInGame(userOne, newGame.id)
        this.webSocket.clientInGame(userTwo, newGame.id)
        this.usersToGame.set(userOne, newGame)
        this.usersToGame.set(userTwo, newGame)
        newGame.init()
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
