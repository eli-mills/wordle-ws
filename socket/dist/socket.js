import { Server } from "socket.io";
import { createServer } from "http";
import * as db from "./db.js";
import { GameEvents, } from "../../common/dist/index.js";
import { evaluateGuess } from "./evaluation.js";
/************************************************
 *                                              *
 *                CONFIGURATION                 *
 *                                              *
 ************************************************/
// Instantiate socket server
export const httpServer = createServer();
export const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"]
    }
});
// Configure socket event listeners
io.on('connection', async (newSocket) => {
    console.log(`User ${newSocket.id} connected.`);
    await db.createPlayer(newSocket.id);
    newSocket.on(GameEvents.REQUEST_NEW_GAME, () => onCreateGameRequest(newSocket));
    newSocket.on(GameEvents.REQUEST_JOIN_GAME, (data) => onJoinGameRequest(newSocket, data.room));
    newSocket.on(GameEvents.DECLARE_NAME, (name) => onDeclareName(newSocket, name));
    newSocket.on(GameEvents.GUESS, (guessReq) => onGuess(newSocket, guessReq));
    newSocket.on('disconnect', () => onDisconnect(newSocket));
});
/************************************************
 *                                              *
 *                EVENT LISTENERS               *
 *                                              *
 ************************************************/
async function onDisconnect(socket) {
    // Get player room
    const roomId = await db.getPlayerRoomId(socket.id);
    // Delete player from db
    console.log(`Player ${socket.id} disconnected`);
    await db.deletePlayer(socket.id);
    emitUpdatedGameState(roomId);
}
async function onCreateGameRequest(socket) {
    console.log("Create game request received");
    const newGame = await db.createGame(socket.id);
    if (newGame === null) {
        socket.emit(GameEvents.NO_ROOMS_AVAILABLE);
        return;
    }
    socket.emit(GameEvents.NEW_GAME_CREATED, newGame);
}
async function onJoinGameRequest(socket, roomId) {
    console.log(`Player ${socket.id} request to join room ${roomId}`);
    if (!await db.gameExists(roomId)) {
        console.log(`Game ${roomId} does not exist`);
        socket.emit(GameEvents.GAME_DNE);
        return;
    }
    socket.join(roomId);
    console.log(`Player ${socket.id} successfully joined room ${roomId}`);
    await db.playerJoinGame(socket.id, roomId);
    await emitUpdatedGameState(roomId);
}
async function onDeclareName(socket, name) {
    // TODO: add check for name uniqueness in room
    console.log(`Name received: ${name}. Writing to db.`);
    await db.updatePlayerName(socket.id, name);
    const roomId = await db.getPlayerRoomId(socket.id);
    await emitUpdatedGameState(roomId);
}
async function onGuess(socket, guessReq) {
    console.log(`Guess received: ${guessReq.guess}`);
    // Evaluate result
    const result = await evaluateGuess(guessReq.guess);
    const guessResult = result.resultByPosition;
    // Store results
    guessResult && await db.createGuessResult(socket.id, guessResult);
    // Send results
    console.log("Sending results");
    socket.emit(GameEvents.EVALUATION, result);
    await emitUpdatedGameState(await db.getPlayerRoomId(socket.id));
}
/************************************************
 *                                              *
 *                    HELPERS                   *
 *                                              *
 ************************************************/
async function emitUpdatedGameState(roomId) {
    const gameStateData = await db.getGame(roomId);
    if (gameStateData !== null) {
        io.to(roomId).emit(GameEvents.UPDATE_GAME_STATE, gameStateData);
    }
}
