import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GameDim, GameMovement, GameSpeed, GameStatus, GameTimings, Rules } from 'contract';
import { EnrichedRequest } from "src/types"
import { InternalEvents, emitInternalEvent } from 'src/internalEvents';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnrichedRemoteSocket, EnrichedSocket, GameWebsocketGateway, IntraUserName, SocketData } from 'src/websocket/game.websocket.gateway';

interface Position {
    x: number
    y: number
}

interface Rectangle {
    topY: number,
    botY: number,
    leftX: number,
    rightX: number
}

abstract class GameObject {

    protected getRectFromOffsetAndPos(
        position: Position,
        xOffset: number,
        yOffset: number
    ): Rectangle {
        return {
            topY: position.y - yOffset,
            botY: position.y + yOffset,
            leftX: position.x - xOffset,
            rightX: position.x + xOffset
        }
    }

    protected _position: Position;

    public abstract update(deltaTime: number): void;

    constructor(protected _startingPosition: Position) {
        this._position = { ...this._startingPosition }
    }

    public reset() {
        this._position = { ...this._startingPosition }
    }

    public get position() {
        return this._position
    }

    public abstract getRect(): Rectangle;

    protected doesBallCollideWithPaddle = (ball: Rectangle, paddle: Rectangle) =>
        (ball.leftX <= paddle.rightX && ball.rightX >= paddle.leftX &&
        ball.topY <= paddle.botY && ball.botY >= paddle.topY)

    protected doesBallCollideWithTopBotWalls = (ball: Rectangle) =>
        (ball.topY <= 0 || ball.botY >= GameDim.court.height)

}

class Paddle extends GameObject {

    private _movement: GameMovement = "NONE";

    public set movement(newMovement: GameMovement) {
        this._movement = newMovement
    }

    static readonly xOffset = GameDim.paddle.width / 2
    static readonly yOffset = GameDim.paddle.height / 2

    constructor(
        _startingPosition: Position,
        private readonly game: Game
    ) {
        super(_startingPosition);
    }

    public getRect = (): Rectangle =>
        super.getRectFromOffsetAndPos(this.position, Paddle.xOffset, Paddle.yOffset)

    public get position() { 
        return super.position
    }

    private set position(newPosition: Position) {
        if (this.getRect().topY < 0)
            newPosition.y = Paddle.yOffset
        else if (this.getRect().botY > GameDim.court.height)
            newPosition.y = GameDim.court.height - Paddle.yOffset
        else if (newPosition.x !== this.position.x)
            newPosition.x = this.position.x
        if (!this.game.ball.passedPaddleLine) {
            this._position = newPosition
            return
        }
        const newRect = super.getRectFromOffsetAndPos(newPosition, Paddle.xOffset,
            Paddle.yOffset)
        const isUp = (this._movement === 'UP')
        const isBallUpper = this.game.ball.position.y < this._position.y
        const topPaddleLimit = GameDim.ballSideLength + 3
        const botPaddleLimit = GameDim.court.height - GameDim.ballSideLength - 3
        if (((isUp && isBallUpper) || (!isUp && !isBallUpper)) &&
            ((isUp && newRect.topY < topPaddleLimit) ||
                (!isUp && newRect.botY > botPaddleLimit))
        ) {
            return
        }
        const paddleCollideWithBall = this.doesBallCollideWithPaddle(
            this.game.ball.getRect(), newRect)
        if (!paddleCollideWithBall) {
            this._position = newPosition
            return
        }
        const newBallY = (isUp)
            ? newRect.topY - Ball.offset - 1
            : newRect.botY + Ball.offset + 1
        this.game.ball.position.y = newBallY
        this._position = newPosition
    }

    public update(deltaTime: number) {
        if (this._movement === 'NONE')
            return
        const ySign = this._movement === 'UP' ? -1 : 1
        this.position = {
            x: this.position.x,
            y: this.position.y + ySign * (GameSpeed.paddle / 1000) * deltaTime
        }
    }

}

class Player {
    public pauseAmount = GameTimings.userPauseAmount
    public score = 0

    public isPause = () => (!!this._pauseData)

    public getPauseStart = () => this._pauseData?.time

    public away: boolean = false

    private _pauseData: {
        time: number,
        callbackId: NodeJS.Timeout
    } | null = null
    
    public pause() {
        this.away = true
        if (this._pauseData)
            return
        if (this.game.status === "INIT" || this.game.status === "BREAK") {
            setTimeout(() => {
                    if (!this.away)
                        return
                    this.pause()
                }, (this.game.status === "INIT"
                        ? GameTimings.initTimeout
                        : GameTimings.breakTimeout) -
                            Date.now() - this.game.startTimeout
            )
            return
        }
        this._pauseData = {
            time: Date.now(),
            callbackId: setTimeout((() => {
                this.game.surrend(this.user.intraUserName)
            }).bind(this), this.pauseAmount)
        }
        this.game.status = 'PAUSE'
    }

    public unpause() {
        this.away = false
        if (!this._pauseData)
            return
        clearTimeout(this._pauseData.callbackId)
        this.pauseAmount -= (Date.now() - this._pauseData.time)
        this._pauseData = null
        const otherPlayer = this.game.getOtherPlayerByIntraUserName(this.user.intraUserName)
        if (!otherPlayer.isPause())
            this.game.status = 'PLAY'
    }

    public adapterListeners = {
        userRoomDeleted: ['delete-room',(roomId: string) => {
            if (roomId !== this.user.intraUserName)
                return
            this.pause()
        }],
        userConnnect: ['connect', (client: EnrichedSocket) => {
            if (client.data.intraUserName != this.user.intraUserName)
                return
            client.data.status = { type: 'GAME' }
            this.unpause()
            client.join(this.game.id)
            client.emit('updatedGameStatus', {
                status: 'RECONNECT',
                ...this.game.getPaddleScores(),
                ...this.game.getPaddlesNames()
            })
            client.emit('updatedGameStatus',
                this.game.getGameData())
        }]
    } as const

    public removeAdapterListeners() {
        this.game.webSocket.server.sockets.adapter
            .removeListener(...this.adapterListeners.userRoomDeleted)
        this.game.webSocket.server.sockets
            .removeListener(...this.adapterListeners.userConnnect)
    }

    constructor(
        public user: SocketData,
        private readonly game: Game,
        public readonly paddle: Paddle
    ) {
        this.game.webSocket.server.sockets.adapter
            .on(...this.adapterListeners.userRoomDeleted)
        this.game.webSocket.server.sockets
            .on(...this.adapterListeners.userConnnect)
    }

}

class Ball extends GameObject {

    protected _position: Position = { ...this._startingPosition }
    private direction: { x: number, y: number } = this.getRandomDirection();
    public passedPaddleLine: boolean = false;

    static readonly offset = GameDim.ballSideLength / 2

    private getRandomDirection() {
        let direction: typeof this.direction;
        do {
            const heading = Math.random() * 2 * Math.PI
            direction = { x: Math.cos(heading), y: Math.sin(heading) }
        } while (Math.abs(direction.x) <= 0.35 || Math.abs(direction.x) >= 0.9)
        return direction
    }

    public getRect = (): Rectangle =>
        super.getRectFromOffsetAndPos(this.position, Ball.offset, Ball.offset)       

    public get position() {
        return super.position
    }

    private set position(newPosition: Position) {
        this._position = newPosition
        if (this.doesBallCollideWithLeftRightWalls(this.getRect())) {
            const scorer = (this.doesBallCollideWithLeftWall(this.getRect()))
                ? this.game.playerB
                : this.game.playerA
            this.game.score(scorer)
            return
        }
        if (!this.passedPaddleLine && (
                this.getRect().rightX > GameDim.court.width - GameDim.paddle.width ||
                this.getRect().leftX < GameDim.paddle.width
            )
        ) {
            this.passedPaddleLine = true
        }
    }

    public setRules(payload: Rules) {
        this.speedIncrType = payload.ballAccelType
        this.baseSpeed = payload.ballBaseSpeed / 1000
        this.speed = this.baseSpeed
        switch (payload.ballAccelType) {
            case "linear": {
                this.linearSpeedIncr = (this.baseSpeed * (payload.ballAccelPercentage / 100) / 1000)
                break ;
            }
            case "exponential": {
                this.exponentialSpeedIncr = payload.ballAccelPercentage / 100 / 1000
                break ;
            }
        }
    }

    constructor(
        _startingPosition: Position,
        private readonly game: Game,
        private baseSpeed = GameSpeed.ball / 1000,
        private speed = baseSpeed,
        private percentageSpeedIncr = GameSpeed.ballAccelPercentage,
        private linearSpeedIncr = (baseSpeed * (percentageSpeedIncr / 100)) / 1000,
        private exponentialSpeedIncr = percentageSpeedIncr / 100 / 1000,
        private speedIncrType: 'linear' | 'exponential' = 'exponential'
    ) {
        super(_startingPosition)
    }

    public reset() {
        super.reset()
        this.direction = this.getRandomDirection()
        this.passedPaddleLine = false
        this.speed = this.baseSpeed
    }

    private getNextPositionWithoutCollision(dist: number) {
        return {
            x: this.position.x + this.direction.x * dist,
            y: this.position.y + this.direction.y * dist
        }
    }

    private doesBallCollideWithLeftRightWalls = (ball: Rectangle) =>
        (this.doesBallCollideWithLeftWall(ball) || this.doesBallCollideWithRightWall(ball))

    private doesBallCollideWithLeftWall = (ball: Rectangle) =>
        (ball.leftX <= 0)

    private doesBallCollideWithRightWall = (ball: Rectangle) =>
        (ball.rightX >= GameDim.court.width)

    private distanceBetweenPositions = (a: Position, b: Position) =>
        Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2))

    private getIntersectionY(target_y: number): number {
        const slope = this.direction.x / this.direction.y
        const delta_x = (target_y - this.position.y) * slope
        return this.position.x + delta_x
    }

    private getIntersectionX(target_x: number): number {
        const slope = this.direction.y / this.direction.x
        const delta_y = (target_x - this.position.x) * slope
        return this.position.y + delta_y
    }

    private move(dist: number) {
        const nextPosWithoutColl: Position = this.getNextPositionWithoutCollision(dist)
        const nextPosRect: Rectangle = super.getRectFromOffsetAndPos(nextPosWithoutColl,
            Ball.offset, Ball.offset)

        const facingPaddle: Paddle = (this.direction.x > 0)
            ? this.game.playerB.paddle
            : this.game.playerA.paddle
        let collideWithPaddles = (this.doesBallCollideWithPaddle(nextPosRect,
                this.game.playerA.paddle.getRect()) ||
            this.doesBallCollideWithPaddle(nextPosRect,
                this.game.playerB.paddle.getRect()))
        const collideWithTopBotWalls = this.doesBallCollideWithTopBotWalls(nextPosRect)

        if (!collideWithPaddles && dist > GameDim.paddle.width &&
            this.doesBallCollideWithLeftRightWalls(nextPosRect) &&
            !this.passedPaddleLine
        ) {
            const xPaddle = (this.direction.x > 0)
                ? GameDim.court.width - GameDim.paddle.width - Ball.offset
                : GameDim.paddle.width + Ball.offset
            const intersecY = this.getIntersectionX(xPaddle)
            if (intersecY + Ball.offset >= facingPaddle.getRect().topY &&
                intersecY - Ball.offset <= facingPaddle.getRect().botY
            ) {
                collideWithPaddles = true
            }
        }

        if (!collideWithPaddles && !collideWithTopBotWalls) {
            this.position = nextPosWithoutColl
            return
        }

        const yWall = (this.direction.y > 0)
            ? GameDim.court.height - Ball.offset
            : Ball.offset
        const xPaddle = (this.direction.x > 0)
            ? GameDim.court.width - GameDim.paddle.width - Ball.offset
            : GameDim.paddle.width + Ball.offset
        let intersectionPos: Position = { x: xPaddle, y: yWall };

        const maxX = GameDim.court.width - GameDim.paddle.width - Ball.offset
        const minX = Ball.offset + GameDim.paddle.width
        if (collideWithTopBotWalls) {
            intersectionPos.x = this.getIntersectionY(yWall)
            if (collideWithPaddles) {
                if (intersectionPos.x > maxX) {
                    intersectionPos.x = maxX - 1
                } else if (intersectionPos.x < minX) {
                    intersectionPos.x = minX + 1
                }
            }
            this.direction.y *= -1
        }
        else if (collideWithPaddles) {
            if (this.passedPaddleLine) {
                const yPaddle = (facingPaddle.getRect().topY >= this.getRect().botY)
                    ? facingPaddle.getRect().topY - Ball.offset
                    : facingPaddle.getRect().botY + Ball.offset
                intersectionPos.x = this.getIntersectionY(yPaddle)
                intersectionPos.y = yPaddle
                this.direction.y *= -1
            } else {
                intersectionPos.y = this.getIntersectionX(xPaddle)
                this.direction.x *= -1
            }
        }
        const remainingDist = this.distanceBetweenPositions(intersectionPos, this._position)
        this.position = intersectionPos
        this.move(remainingDist)
    }

    public update(deltaTime: number) {
        this.move(this.speed * deltaTime)
        if (this.speedIncrType === 'linear')
            this.speed += this.linearSpeedIncr * deltaTime
        else
            this.speed *= (1 + this.exponentialSpeedIncr * deltaTime)
    }
}

type Status = Game['_status']

class Game {

    public readonly id: string;

    private _lastUpdateTime: number | null = null
    // private lastUpdateTime: number | null = null
    private set lastUpdateTime (arg: number | null) {
        this._lastUpdateTime = arg
    }

    private get lastUpdateTime () {
        return this._lastUpdateTime
    }

    private _status: Extract<
            GameStatus['status'],
            "INIT" | "BREAK" | "PAUSE" | "PLAY" | "END"
        > = 'INIT';
    private readonly maxScore: number = 10
    public startTimeout = Date.now();
    private readonly isCustomGame: boolean;

    public get status() {
        return this._status
    }

    public setRules(payload: Rules, intraUserName: IntraUserName) {
        if (intraUserName !== this.hostIntraName)
            return
        if (this._status !== 'INIT')
            return
        this.ball.setRules(payload)
        this.status = 'PLAY'
        if (this.playerA.away)
            this.playerA.pause()
        if (this.playerB.away)
            this.playerB.pause()
    }

    public set status(newStatus: typeof this._status) {
        this._status = newStatus
        if (this._status !== 'PLAY')
            this.lastUpdateTime = null
        switch(newStatus) {
            case 'INIT': {
                this.emitGamePositions()
                this.startTimeout = Date.now()
                this.emitUpdatedGameStatus()
                setTimeout(
                    () => {
                        if (this.status !== 'INIT')
                            return
                        this.status = 'PLAY'
                    },
                    this.isCustomGame
                        ? GameTimings.initCustomGameTimeout
                        : GameTimings.initTimeout
                )
                break ;
            }
            case 'PLAY': {
                this.emitUpdatedGameStatus()
                break ;
            }
            case 'PAUSE': {
                this.emitUpdatedGameStatus()
                break ;
            }
            case 'BREAK': {
                this.startTimeout = Date.now()
                this.emitUpdatedGameStatus()
                setTimeout(
                    () => {
                        if (this.status !== 'BREAK')
                            return
                        this.status = 'PLAY'
                    },
                    GameTimings.breakTimeout
                )
                break ;
            }
            case 'END': {
                this.emitUpdatedGameStatus()
            }
        }
    }

    public readonly playerA: Player;
    public readonly playerB: Player;
    public readonly ball: Ball = new Ball({
        x: GameDim.court.width / 2 - Ball.offset,
        y: GameDim.court.height / 2 - Ball.offset
    }, this)

    constructor(
        clientA: EnrichedRemoteSocket | EnrichedSocket,
        clientB: EnrichedRemoteSocket | EnrichedSocket,
        public readonly webSocket: GameWebsocketGateway,
        private eventEmitter: EventEmitter2,
        private readonly prisma: PrismaService,
        private readonly hostIntraName?: IntraUserName
    ) {
        this.isCustomGame = !!hostIntraName
        this.id = `${clientA.data.intraUserName}@${clientB.data.intraUserName}`
        this.playerA = new Player(clientA.data, this, new Paddle({
            x: Paddle.xOffset,
            y: GameDim.court.height / 2
        }, this))
        this.playerB = new Player(clientB.data, this, new Paddle({
            x: (GameDim.court.width - Paddle.xOffset),
            y: GameDim.court.height / 2
        }, this))

        clientA.data.status = { type: 'GAME' }
        clientB.data.status = { type: 'GAME' }

        this.webSocket.server.sockets.in([
            clientA.data.intraUserName,
            clientB.data.intraUserName
        ]).socketsJoin(this.id)
        
        this.status = 'INIT'
    }

    public getPaddlesNames() {
        return {
            paddleLeftDisplayName: this.playerA.user.displayName,
            paddleRightDisplayName: this.playerB.user.displayName
        }
    }

    public getPaddleScores() {
        return {
            paddleLeftScore: this.playerA.score,
            paddleRightScore: this.playerB.score
        }
    }

    private emitGamePositions() {
        this.webSocket.server.to(this.id).volatile.emit('updatedGamePositions', {
            paddleLeft: this.playerA.paddle.position,
            paddleRight: this.playerB.paddle.position,
            ball: this.ball.position 
        })
    }

    private emitUpdatedGameStatus() {
        this.webSocket.server.to(this.id)
            .emit('updatedGameStatus', this.getGameData())
    }

    private getPlayerByIntraUserName(intraUserName: IntraUserName) {
        return (this.playerA.user.intraUserName === intraUserName)
            ? this.playerA
            : this.playerB
    }

    public getOtherPlayerByIntraUserName(intraUserName: IntraUserName) {
        return (this.playerA.user.intraUserName === intraUserName)
            ? this.playerB
            : this.playerA
    }

    public updateMovement(intraUserName: IntraUserName, move: GameMovement) {
        this.getPlayerByIntraUserName(intraUserName)
            .paddle.movement = move
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
            Function.prototype.apply.call(gameObject[key], gameObject, args)
        })
    }

    public getWinner() {
        return (this.playerA.score > this.playerB.score)
            ? this.playerA
            : this.playerB
    }

    public getLooser() {
        return (this.playerA.score < this.playerB.score)
            ? this.playerA
            : this.playerB
    }

    public async handleWin() {
        this.status = 'END'
        this.playerA.removeAdapterListeners()
        this.playerB.removeAdapterListeners()

        this.webSocket.server.sockets
            .in(this.id)
            .socketsLeave(this.id)
        emitInternalEvent(this.eventEmitter, "game.end", {
            id: this.id,
            playerA: this.playerA.user,
            playerB: this.playerB.user
        })
        await this.prisma.matchSummary.create({
            data: {
                looser: { connect: { name: this.getLooser().user.username } },
                looserScore: this.getLooser().score,
                winner: { connect: { name : this.getWinner().user.username } },
                winnerScore: this.getWinner().score,
            }
        })
    }

    public surrend(intraUserName: IntraUserName) {
        const winner = this.playerA.user.intraUserName === intraUserName
            ? this.playerB
            : this.playerA
        winner.score = this.maxScore
        this.handleWin()
    }

    public getGameData()
    : Extract<GameStatus, { status: Status }> {
        switch (this._status) {
            case 'INIT': {
                return {
                    status: 'INIT',
                    timeout: (this.isCustomGame
                        ? GameTimings.initCustomGameTimeout
                        : GameTimings.initTimeout)
                            - (Date.now() - this.startTimeout),
                    ...this.getPaddleScores(),
                    ...this.getPaddlesNames(),
                    hostIntraName: this.hostIntraName
                }
            }
            case 'BREAK': {
                return {
                    status: 'BREAK',
                    timeout: GameTimings.breakTimeout - (Date.now() - this.startTimeout),
                    ...this.getPaddleScores()
                }
            }
            case 'PAUSE': {
                const pausingPlayer = this.playerA.isPause()
                    ? this.playerA
                    : this.playerB
                const pauseStart = pausingPlayer.getPauseStart()
                return {
                    status: 'PAUSE',
                    timeout: pauseStart
                        ? pausingPlayer.pauseAmount - (Date.now() - pauseStart)
                        : pausingPlayer.pauseAmount,
                    pausingUsername: pausingPlayer.user.username,
                    pausingDisplayName: pausingPlayer.user.displayName
                }
            }
            case 'PLAY': {
                return {
                    status: 'PLAY',
                    ...this.getPaddleScores()
                }
            }
            case 'END': {
                return {
                    status: 'END',
                    winnerUserName: this.getWinner().user.username,
                    winnerDisplayName: this.getWinner().user.displayName,
                    ...this.getPaddleScores()
                }
            }
        }
    }

    public getFullGameStatus(intraName: IntraUserName)
    : Extract<GameStatus, { status: Status }>
    & Omit<
        Extract<GameStatus, { status: 'INIT' }>,
        "status" | "timeout"
    > {
        return {
            ...this.getGameData(),
            ...this.getPaddleScores(),
            ...this.getPaddlesNames(),
        }
    }

    public score(player: Player) {
        player.score++
        this.callOnAllGameObjects("reset")
        if (player.score >= this.maxScore) {
            this.handleWin()
            return
        }
        this.status = 'BREAK'
    }

    public update() {
        const currentTime = Date.now()
        if (this.lastUpdateTime) {
            const deltaTime = currentTime - this.lastUpdateTime
            this.callOnAllGameObjects("update", deltaTime)
            if (this.status !== 'PLAY')
                return
        }
        this.emitGamePositions()
        this.lastUpdateTime = currentTime
    }

}

@Injectable()
export class GameService {

    private queue: EnrichedSocket | null = null;
    private games = new Map<string, Game>();
    private usersToGame = new Map<string, Game>();

    constructor(
        @Inject(forwardRef(() => GameWebsocketGateway))
        private readonly webSocket: GameWebsocketGateway,
        private eventEmitter: EventEmitter2,
        private readonly prisma: PrismaService
    ) {
        setTimeout(() => { this.webSocket.server.on('connect', this.connectUser.bind(this))}, 0)
        setTimeout(this.loop.bind(this), 0)
    }

    public disconnectUser({ intraUserName }: EnrichedSocket['data']) {
        if (this.queue?.data.intraUserName === intraUserName)
            this.queue = null
    }

    public connectUser(client: EnrichedSocket) {
        client.once('disconnect', () => this.disconnectUser(client.data))
    }

    private loop() {
        this.games.forEach( game => {
            if (game.status === 'PLAY') {
                game.update()
            }
        })
        setTimeout(this.loop.bind(this), 0)
    }

    public getGameStatusForUser(intraUserName: IntraUserName) {
        return this.usersToGame.get(intraUserName)
            ?.getFullGameStatus(intraUserName)
    }

    public getGameIdForUser(username: IntraUserName) {
        return this.usersToGame.get(username)?.id
    }

    public async createGame(userOne: EnrichedRemoteSocket | EnrichedSocket,
        userTwo: EnrichedRemoteSocket | EnrichedSocket,
        hostIntraName?: IntraUserName
    ) {
        const newGame = new Game(userOne, userTwo, this.webSocket, this.eventEmitter, this.prisma, hostIntraName)
        this.games.set(newGame.id, newGame)
        this.usersToGame.set(userOne.data.intraUserName, newGame)
        this.usersToGame.set(userTwo.data.intraUserName, newGame)
    }

    @OnEvent('game.end')
    private async destroyGame(payload: InternalEvents['game.end']) {
        this.usersToGame.delete(payload.playerA.intraUserName)
        this.usersToGame.delete(payload.playerB.intraUserName)
        this.games.delete(payload.id)
    }

    public queueUser(client: EnrichedSocket) {
        if (this.queue?.data.intraUserName === client.data.intraUserName)
            return
        if (!this.queue) {
            this.queue = client
            return
        }
        const opponent = this.queue
        this.queue = null
        this.createGame(opponent, client)
    }

    public deQueueUser(intraUserName: IntraUserName) {
        if (this.queue?.data.intraUserName === intraUserName)
            this.queue = null
    }

    public surrend = (intraUserName: IntraUserName) =>
        this.usersToGame.get(intraUserName)?.surrend(intraUserName)

    public movement(intraUserName: IntraUserName, move: GameMovement) {
        const game = this.usersToGame.get(intraUserName)
        if (!game)
            return
        game.updateMovement(intraUserName, move)
    }

    public setRules(payload: Rules, intraUserName: IntraUserName) {
        this.usersToGame.get(intraUserName)?.setRules(payload, intraUserName)
    }
    
    public async getMatchHistory(take: number, username: string, cursor?: string) {
        const matches = await this.prisma.matchSummary.findMany({
            where: { OR:[{winnerName: username}, {looserName: username}] },
            orderBy: { creationDate: 'desc' },
            cursor: !!cursor ? { id: cursor } : undefined,
            skip: Number(!!cursor),
            take,
            select: {
                creationDate: true,
                looser: { select: { displayName: true, name: true } },
                winner: { select: { displayName :true, name: true } },
                looserScore: true,
                winnerScore: true,
                id: true
            }
        })
        return matches.map((match) => {
            const { looser, winner, ...rest } = match
            return {
                ...rest,
                looserDisplayName: looser.displayName,
                winnerDisplayName: winner.displayName,
                win: winner.name === username,
            }
        })
    }

}
