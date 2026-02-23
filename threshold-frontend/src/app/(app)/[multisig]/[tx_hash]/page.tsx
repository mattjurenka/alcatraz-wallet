"use client"

import { addSignature, combineSignatures, getTransaction } from "@/lib/actions";
import { sui_client } from "@/lib/clients";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Transaction() {
    const { multisig, tx_hash  } = useParams<{ multisig: string, tx_hash: string }>()
	const { execute: executeCombine, result } = useAction(combineSignatures)
	const { execute: executeGetTransaction, result: transactionResult } = useAction(getTransaction)
	const { execute: executeAdd, result: addResult } = useAction(addSignature)
    const dAppKit = useDAppKit();
    if (result.data) console.log(result.data)
    console.log(transactionResult.data)

    useEffect(() => {
        executeGetTransaction({ tx_hash })
    }, [])

    return <div className="flex flex-col gap-4">
        <ConnectButton />
        <button onClick={async () => {
            const tx = transactionResult.data?.trx
            if (!tx) return
            const result = await dAppKit.signTransaction({ transaction: tx })

            executeAdd({
                tx: result.bytes,
                multisig,
                signature: result.signature
            })
        }}>
            Sign
        </button>
        <button
            onClick={() => {
                executeCombine({ multisig, tx_hash })
            }}
        >Combine</button>
        <button
            onClick={() => {
                const trx = transactionResult.data?.trx!
                const signature = result.data?.combined!
                

                if (trx && signature) {
                    console.log("executing")
                    sui_client.executeTransactionBlock({
                        transactionBlock: trx,
                        signature
                    })
                }
            }}
        >Submit</button>

    </div>
}