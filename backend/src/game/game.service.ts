import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameDim, GameMovement, GameSpeed, GameStatus, GameTimings } from 'contract';
import { EnrichedRequest } from 'src/auth/auth.service';
import { GameWebsocketGateway, IntraUserName } from 'src/websocket/game.websocket.gateway';

interface Position {
    x: number
    y: number
}

abstract class GameObject {

    protected abstract readonly _startingPosition: Position;

    protected abstract _position: Position;

    public abstract update(deltaTime: number): void;

    public reset() {
        this._position = { ...this._startingPosition }
    }

    public get position() {
        return this._position
    }

}

class Paddle extends GameObject {

    protected _position: Position = { ...this._startingPosition };

    private _moovement: GameMovement = "NONE";

    public set moovement(newMovement: GameMovement) {
        this._moovement = newMovement
    }

    constructor(
        protected readonly _startingPosition: Position
    ) { super() }

    // public only to not be forced to redefine getter
    // do not use setter outside of paddle class
    public set position(newPosition: Position) {
        if (newPosition.y < 0)
            newPosition.y = 0
        else if (newPosition.y + GameDim.paddle.height > GameDim.court.height)
            newPosition.y = GameDim.court.height - GameDim.paddle.height
        else if (newPosition.x !== this.position.x)
            newPosition.x = this.position.x
        this._position = newPosition
    }

    public update(deltaTime: number) {
        if (this._moovement === 'NONE')
            return
        const ySign = this._moovement === 'UP' ? -1 : 1
        this.position = {
            x: this.position.x,
            y: this.position.y + ySign * (GameSpeed.paddle / 1000) * deltaTime
        }
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

class Ball extends GameObject {

    protected _position: Position = { ...this._startingPosition }
    private direction: { x: number, y: number };

    private getRandomDirection() {
        let direction: typeof this.direction;
        do {
            const heading = Math.random() * 2 * Math.PI
            direction = { x: Math.cos(heading), y: Math.sin(heading) }
        } while (Math.abs(direction.x) <= 0.2 || Math.abs(direction.x) >= 0.9)
        return direction
    }

    constructor(
        protected readonly _startingPosition: Position,
        private readonly game: Game,
        private speed = GameSpeed.ball / 1000
    ) {
        super()
        this.direction = this.getRandomDirection()
    }

    private getNextPosition(dist: number) {
        return {
            x: this.position.x + this.direction.x * dist,
            y: this.position.y + this.direction.y * dist
        }
    }

    private doesBallCollideWithPaddle = (ball: Position, paddle: Position) =>
        (ball.x <= (paddle.x + GameDim.paddle.width) &&
        (ball.x + GameDim.ballSideLength) >= paddle.x &&
        (ball.y - GameDim.ballSideLength) >= paddle.y &&
        ball.y <= (paddle.y + GameDim.paddle.height))

    private doesBallCollideWithTopBotWalls = (ball: Position) =>
        (ball.y <= 0 || (ball.y + GameDim.ballSideLength) >= GameDim.court.height)

    public update(deltaTime: number) {
        const dist = (GameSpeed.ball / 1000) * deltaTime
        const nextPosition: Position = this.getNextPosition(dist)
        if (this.doesBallCollideWithTopBotWalls(nextPosition)) {
            this.direction.y *= -1
            nextPosition.y = this.position.y + this.direction.y * dist
        }
        if (this.doesBallCollideWithPaddle(nextPosition,
            this.game.playerA.paddle.position)
        ) {
            this.direction.x *= -1
            nextPosition.x = this.position.x + this.direction.x * dist
        }
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

    public readonly playerA: Player;
    public readonly playerB: Player;
    private readonly ball: Ball = new Ball({
        x: GameDim.court.width / 2 - GameDim.ballSideLength / 2,
        y: GameDim.court.height / 2 - GameDim.ballSideLength / 2
    }, this)

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

    private callOnAllGameObjects<
        Key extends {
            [K in keyof GameObject]: GameObject[K] extends ((...args: any[]) => void)
                ? K
                : never
        }[keyof GameObject],
    >(
        key: Key,
        ...args: Parameters<GameObject[Key]>
    ) {
        const gameObjects: GameObject[] = [
            this.playerA.paddle,
            this.playerB.paddle,
            this.ball
        ]
        gameObjects.forEach(gameObject => {
            // TODO maybe see why types are broken here ?
            // (bonus, it's perfectly safe (should be))
            Function.prototype.apply.call(gameObject[key], gameObject, args)
        })
    }

    // private moove = (deltaTime: number) => this.callOnAllGameObjects("moove", deltaTime)
    // private reset = () => this.GameObjectsCaller("reset")

    private update(newStatus?: typeof this.status) {
        if (newStatus)
            this.status = newStatus
        if (this.status !== 'PLAY') {
            this.lastUpdateTime = null
            return
        }
        const currentTime = Date.now()
        if (this.lastUpdateTime) {
            const deltaTime = currentTime - this.lastUpdateTime
            if (deltaTime >= 1) {
                this.callOnAllGameObjects("update", deltaTime)
                this.emitGamePositions()
            }
        }
        else
            this.emitGamePositions()
        this.lastUpdateTime = currentTime
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
