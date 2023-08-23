import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameDim, GameMoovement } from 'contract';
import { EnrichedRequest } from 'src/auth/auth.service';
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
        public readonly user: EnrichedRequest['user'],
        private readonly game: Game,
        private _position: Position
    ) {}

    get position() {
        return this._position
    }

}

class Ball {

    constructor(
        private _position: Position
    ) {}

    get position() {
        return this._position
    }
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
        playerA: EnrichedRequest['user'],
        playerB: EnrichedRequest['user'],
        private readonly webSocket: GameWebsocketGateway
    ) {
        this.id = `${playerA.intraUserName}${playerB.intraUserName}`
        this.playerA = new Player(playerA, this, {
            x: 0,
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        })
        this.playerB = new Player(playerB, this, {
            x: (GameDim.court.width - GameDim.paddle.width),
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        })
    }

    private emitGamePositions() {
        this.webSocket.server.to(this.id).emit('updatedGamePositions', {
            paddleLeft: this.playerA.position,
            paddleRight: this.playerB.position,
            ball: this.ball.position 
        })
    }

    private update() {
        this.emitGamePositions()
        this.update()
    }

    public init() {
        this.webSocket.server.to(this.id).emit('updatedGameStatus', {
            status: 'INIT',
            timeout: 3000,
            paddleLeftUserName: this.playerA.user.username,
            paddleRightUserName: this.playerB.user.username
        })
        setTimeout(this.update.bind(this), 3000)
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

    private queue: EnrichedRequest['user'] | null = null;
    private games = new Map<string, Game>();
    private usersToGame = new Map<string, Game>();

    constructor(
        @Inject(forwardRef(() => GameWebsocketGateway))
        private readonly webSocket: GameWebsocketGateway
    ) {}

    public disconnectUser(intraUserName: IntraUserName) {
        if (this.queue?.intraUserName === intraUserName)
            this.queue = null
        const game = this.usersToGame.get(intraUserName)
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

    private async createGame(userOne: EnrichedRequest['user'], userTwo: EnrichedRequest['user']) {
        console.log("createGame")
        const newGame = new Game(userOne, userTwo, this.webSocket)
        this.games.set(newGame.id, newGame)
        this.webSocket.clientInGame(userOne.intraUserName, newGame.id)
        this.webSocket.clientInGame(userTwo.intraUserName, newGame.id)
        this.usersToGame.set(userOne.intraUserName, newGame)
        this.usersToGame.set(userTwo.intraUserName, newGame)
        newGame.init()
    }

    public queueUser(user: EnrichedRequest['user']) {
        if (this.queue?.intraUserName === user.intraUserName)
            return
        if (!this.queue) {
            this.queue = user
            return
        }
        const opponent = this.queue
        this.queue = null
        this.createGame(opponent, user)
    }

    public deQueueUser(intraUserName: IntraUserName) {
        if (this.queue?.intraUserName === intraUserName)
            this.queue = null
    }

}
