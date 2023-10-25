import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createContext, useState, useEffect } from 'react'
import { Socket } from 'socket.io-client';
import { GameEvents, GameStateData } from '../../../common';

interface GlobalContext {
    socket: Socket | undefined,
    setSocket: (_: Socket) => void,
    opponentList: string[],
    setOpponentList: (_: string[]) => void
    room: string,
    setRoom: (_: string) => void,
    playerName: string,
    setName: (_: string) => void
}

const initialGlobalContext: GlobalContext = {
    socket: undefined, 
    setSocket: ()=>{},
    opponentList: [],
    setOpponentList: ()=>{},
    room: "",
    setRoom: ()=>{},
    playerName: "",
    setName: ()=>{}
};

export const GlobalContext = createContext<GlobalContext>(initialGlobalContext);

export default function App({ Component, pageProps }: AppProps) {
    const [socket, setSocket] = useState<Socket>();
    const [opponentList, setOpponentList] = useState<string[]>([]);
    const [room, setRoom] = useState<string>("");
    const [playerName, setName] = useState<string>("");

    useEffect(()=> {
        socket?.on(GameEvents.UPDATE_GAME_STATE, (gameState: GameStateData) => {
            console.log(gameState);
            setOpponentList(gameState.playerList);
            setRoom(gameState.roomId);
            console.log(`Set opponentList to ${gameState.playerList}`);
        });

        return () => {
            socket?.off(GameEvents.UPDATE_GAME_STATE);
        }
    }, [socket, opponentList, room]);

    const globalState : GlobalContext = {
        socket, 
        setSocket, 
        opponentList, 
        setOpponentList,
        room,
        setRoom,
        playerName,
        setName
    }

    return <GlobalContext.Provider value={{...globalState}}><Component {...pageProps} /></GlobalContext.Provider>
}
