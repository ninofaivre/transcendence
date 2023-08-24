import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameDim, GameMovement, GameSpeed, GameStatus, GameTimings } from 'contract';
import { EnrichedRequest } from 'src/auth/auth.service';
import { GameWebsocketGateway, IntraUserName } from 'src/websocket/game.websocket.gateway';

interface Position {
    x: number
    y: number
}

class Paddle {

    private _position: Position = { ...this._startingPosition };

    public resetPosition() {
        this._position = { ...this._startingPosition }
    }

    private _moovement: GameMovement = "NONE";

    public set moovement(newMovement: GameMovement) {
        this._moovement = newMovement
    }

    constructor(
        private readonly _startingPosition: Position
    ) {}

    get position() {
        return this._position
    }

    private set position(newPosition: Position) {
        if (newPosition.y < 0)
            newPosition.y = 0
        else if (newPosition.y + GameDim.paddle.height > GameDim.court.height)
            newPosition.y = GameDim.court.height - GameDim.paddle.height
        else if (newPosition.x !== this.position.x)
            newPosition.x = this.position.x
        this._position = newPosition
    }

    public moove(deltaTime: number) {
        if (this._moovement === 'NONE' || deltaTime < 1)
            return
        const ySign = this._moovement === 'UP' ? 1 : -1
        const newPosition: Position = {
            x: this.position.x,
            y: this.position.y + ySign * (GameSpeed.paddle / 1000) * deltaTime
        }
        this.position = newPosition
    }

}

class Player {

    private pauseAmount = GameTimings.userPauseAmount
    private score = 0

    constructor(
        public readonly user: EnrichedRequest['user'],
        private readonly game: Game,
        public readonly paddle: Paddle
    ) {}

}

class Ball {

    private _position: Position = { ...this._startingPosition }

    constructor(
        private readonly _startingPosition: Position
    ) {}

    get position() {
        return this._position
    }
}

class Game {

    public readonly id: string;

    private readonly score: number = 0;
    private lastUpdateTime: number | null = null
    private _status: GameStatus['status'] = 'INIT'

    get status() {
        return this._status
    }

    set status(newStatus: typeof this._status) {
        switch(newStatus) {
            case 'INIT': {
                this.emitGamePositions()
                this.webSocket.server.to(this.id).emit('updatedGameStatus', {
                    status: 'INIT',
                    timeout: GameTimings.initTimeout,
                    paddleLeftUserName: this.playerA.user.username,
                    paddleRightUserName: this.playerB.user.username
                })
                setTimeout(this.update.bind(this), 3000, 'PLAY')
                break ;
            }
            case 'PLAY': {
                this.webSocket.server.to(this.id).emit('updatedGameStatus', {
                    status: 'PLAY'
                })
                break ;
            }
            case 'PAUSE': {
                this.webSocket.server.to(this.id).emit('updatedGameStatus', {
                    status: 'PAUSE',
                    timeout: 99999,
                    username: "notImplementedYet"
                })
                break ;
            }
            case 'BREAK': {
                this.webSocket.server.to(this.id).emit("updatedGameStatus", {
                    status: 'BREAK',
                    timeout: GameTimings.breakTimeout
                })
            }
        }
        this._status = newStatus
    }

    private readonly playerA: Player;
    private readonly playerB: Player;
    private readonly ball: Ball = new Ball({
        x: GameDim.court.width / 2 - GameDim.ballSideLength,
        y: GameDim.court.height / 2 - GameDim.ballSideLength
    })

    constructor(
        playerA: EnrichedRequest['user'],
        playerB: EnrichedRequest['user'],
        private readonly webSocket: GameWebsocketGateway
    ) {
        this.id = `${playerA.intraUserName}${playerB.intraUserName}`
        this.playerA = new Player(playerA, this, new Paddle({
            x: 0,
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        }))
        this.playerB = new Player(playerB, this, new Paddle({
            x: (GameDim.court.width - GameDim.paddle.width),
            y: (GameDim.court.height / 2 - GameDim.paddle.height / 2)
        }))
    }

    private emitGamePositions() {
        this.webSocket.server.to(this.id).emit('updatedGamePositions', {
            paddleLeft: this.playerA.paddle.position,
            paddleRight: this.playerB.paddle.position,
            ball: this.ball.position 
        })
    }

    public updateMovement(intraUserName: IntraUserName, moove: GameMovement) {
        const player = (this.playerA.user.intraUserName === intraUserName)
            ? this.playerA
            : this.playerB
        player.paddle.moovement = moove
    }

    private moove(deltaTime: number) {
        this.playerA.paddle.moove(deltaTime)
        this.playerB.paddle.moove(deltaTime)
    }

    private update(newStatus?: typeof this.status) {
        if (newStatus)
            this.status = newStatus
        if (this.status !== 'PLAY') {
            this.lastUpdateTime = null
            return
        }
        const currentTime = Date.now()
        if (this.lastUpdateTime)
            this.moove(currentTime - this.lastUpdateTime)
        this.lastUpdateTime = currentTime
        this.emitGamePositions()
        setTimeout(this.update.bind(this), 0)
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
        // game.pause()
    }

    public connectUser(username: IntraUserName) {
        const game = this.usersToGame.get(username)
        if (!game)
            return
        this.webSocket.clientInGame(username, game.id)
        // game.unpause()
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
        newGame.status = 'INIT'
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

    public moovement(intraUserName: IntraUserName, moove: GameMovement) {
        const game = this.usersToGame.get(intraUserName)
        if (!game)
            return
        game.updateMovement(intraUserName, moove)
    }

}
