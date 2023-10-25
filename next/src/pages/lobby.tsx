import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GlobalContext } from './_app';
import { useEffect, useContext, useState } from 'react';
import { JoinRoomRequestData, GameStateData, GameEvents } from "../../../common";
import NameModal from '@/components/NameModal';


export default function LobbyPage() {
    const {
        socket, 
        opponentList,
        setOpponentList,
        room,
        setRoom
    } = useContext(GlobalContext);
    const router = useRouter();
    const { room: queryRoom } = router.query as {room: string};
    const [displayModal, setDisplayModal] = useState<boolean>(true);

    useEffect(()=>{
        const joinRoomRequest : JoinRoomRequestData = { room: queryRoom };
        queryRoom && socket && console.log(`Sending joinRoomRequest for room ${queryRoom}`);
        queryRoom && socket?.emit(GameEvents.REQUEST_JOIN_ROOM, joinRoomRequest)
    }, [queryRoom]);

    useEffect(()=> {
        socket?.on(GameEvents.ROOM_DNE, () => alert("The requested room does not exist."));
        return () => {
            socket?.off(GameEvents.ROOM_DNE);
        }
    }, []);

    return (
        <>
            <Head>
                <title>Wordle WS</title>
            </Head>
            <main>
                {socket && (<div>
                    <h1>Room {room}</h1>
                    <ul>
                        {opponentList.map((name, index) => <li key={index}>{name}</li>)}
                    </ul>
                    {displayModal && <NameModal socket={socket} setDisplayModal={setDisplayModal}/>}
                    <Link href={"/game"}>Start Game</Link>
                </div>)}
                {!socket && <h1>NOT CONNECTED</h1>}
            </main>
        </>
    )
}
