"use client"

import { addSignature, combineSignatures, getTransaction } from "@/lib/actions";
import { sui_client } from "@/lib/clients";
import { trxDataFetcher, useStore } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { Copy, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function Transaction() {
    const { multisig: multisig_addr, tx_hash  } = useParams<{ multisig: string, tx_hash: string }>()
    const multisig = useStore(s => s.multisigs[multisig_addr])
    const { data, error, isLoading } = useSWR([multisig_addr, tx_hash], trxDataFetcher)
    console.log("Found datal", data)

    return <div className="px-4 lg:px-[30%] h-full flex grow flex-col py-16 gap-4">
        <div className="flex gap-4">
            <div>
                <p>Transaction</p>
                <h3 className="text-3xl font-semibold">
                    {shortenAddress("0x" + tx_hash).substring(2)}
                    <button className="cursor-pointer ml-4" onClick={() => navigator.clipboard.writeText(tx_hash)}>
                        <Copy />
                    </button>
                </h3>
            </div>
        </div>
        <h3 className="font-semibold text-lg">Simulation</h3>
        <p>TODO: add simulation</p>
        <h3 className="font-semibold text-lg">Signatures</h3>
        {multisig.signers.map(signer => <div key={signer} className="flex gap-2 items-center">
            <p>{shortenAddress(signer)}</p><X />
        </div>)}
        <p className="text-lg">0 out of {multisig.threshold} Signatures Found</p>
    </div>

}

//export default function Transaction() {
//    const { multisig, tx_hash  } = useParams<{ multisig: string, tx_hash: string }>()
//	const { execute: executeCombine, result } = useAction(combineSignatures)
//	const { execute: executeGetTransaction, result: transactionResult } = useAction(getTransaction)
//	const { execute: executeAdd, result: addResult } = useAction(addSignature)
//    const dAppKit = useDAppKit();
//    if (result.data) console.log(result.data)
//    console.log(transactionResult.data)
//
//    useEffect(() => {
//        executeGetTransaction({ tx_hash })
//    }, [])
//
//    return <div className="flex flex-col gap-4">
//        <ConnectButton />
//        <button onClick={async () => {
//            const tx = transactionResult.data?.trx
//            if (!tx) return
//            const result = await dAppKit.signTransaction({ transaction: tx })
//
//            executeAdd({
//                tx: result.bytes,
//                multisig,
//                signature: result.signature
//            })
//        }}>
//            Sign
//        </button>
//        <button
//            onClick={() => {
//                executeCombine({ multisig, tx_hash })
//            }}
//        >Combine</button>
//        <button
//            onClick={() => {
//                const trx = transactionResult.data?.trx!
//                const signature = result.data?.combined!
//
//                if (trx && signature) {
//                    console.log("executing")
//                    sui_client.executeTransactionBlock({
//                        transactionBlock: trx,
//                        signature
//                    })
//                }
//            }}
//        >
//            Submit
//        </button>
//    </div>
//}