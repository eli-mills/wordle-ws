import Head from 'next/head'
import { useState } from 'react'
import Guess from '@/components/Guess'
import GamePanel from '@/components/GamePanel'

export default function Home() {

  return (
    <>
      <Head>
        <title>Wordle WS</title>
      </Head>
      <main>
        <GamePanel />
        {/*<InfoPanel />*/}
      </main>
    </>
  )
}
