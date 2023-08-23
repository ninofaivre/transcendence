import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { GameWebsocketGateway, IntraUserName } from 'src/websocket/game.websocket.gateway';

interface Game {
    id: string
}

@Injectable()
export class GameService {

    private queue: IntraUserName | null = null;
    private games = new Map<string, Game>();
    private usersToGames = new Map<string, Game>();

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
        return this.usersToGames.get(username)?.id
    }

    private async createGame(userOne: IntraUserName, userTwo: IntraUserName) {
        console.log("createGame")
        const newGame = { id: `${userOne}${userTwo}` }
        this.games.set(newGame.id, newGame)
        this.usersToGames.set(userOne, newGame)
        this.usersToGames.set(userTwo, newGame)
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
