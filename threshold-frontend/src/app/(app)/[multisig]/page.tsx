"use client"

import { addSignature } from "@/lib/actions";
import { sui_client } from "@/lib/clients";
import { ConnectButton, useDAppKit } from "@mysten/dapp-kit-react";
import { parseTransactionBcs } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { verifyTransactionSignature } from "@mysten/sui/verify";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";

export default function Multisig() {
    const { multisig } = useParams<{ multisig: string }>()
    const dAppKit = useDAppKit();

	const { execute: executeAdd, result: addResult } = useAction(addSignature)
    console.log(addResult)

    return <div>
        <ConnectButton />
        <p>{multisig}</p>
        <button onClick={async () => {
            const tx = new Transaction()
            tx.setSender(multisig)

            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(100)])
            tx.transferObjects([coin], "0xde3cf6e00c0c521cc36057f347ad8f2658d6037168976cf701beca4174a7f8d8")

            const result = await dAppKit.signTransaction({ transaction: tx })

            executeAdd({
                multisig,
                signature: result.signature,
                tx: result.bytes
            })
        }}>
            Sign
        </button>
    </div>
}