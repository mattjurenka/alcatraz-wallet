"use client"

import { Button } from "@/components/ui/button";
import { addSignature, combineSignatures, getTransaction } from "@/lib/actions";
import { sui_client } from "@/lib/clients";
import { trxDataFetcher, useStore } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { Check, Copy, Loader, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

function GetIcon({ signer, signers }: { signers: string[] | undefined, signer: string }) {
    console.log(signer, signers)
    if (signers) {
        if (new Set(signers).has(signer)) { 
            return <Check />
        } else {
            return <X />
        }
    } else {
        return <Loader />
    }
}

export default function Transaction() {
    const { multisig: multisig_addr, tx_hash  } = useParams<{ multisig: string, tx_hash: string }>()
    const multisig = useStore(s => s.multisigs[multisig_addr])
    const account = useCurrentAccount()
    const dAppKit = useDAppKit()
    const { data, error, isLoading } = useSWR([multisig_addr, tx_hash], trxDataFetcher)

    const sig_state = (() => {
        if (!account) return "loggedout"
        if (!(data?.signed || data?.trx)) return "loading"
        if (data.signed.length >= multisig.threshold) return "combineable"
        if (new Set(data.signed).has(account.address)) return "alreadysigned"
        if (data.signed.length + 1 >= multisig.threshold) return "submitaftersign"
        return "signeeded"
    })()

    return <div className="px-2 sm:px-4 md:px-16 lg:px-32 2xl:px-[30%] h-full flex grow flex-col py-16 gap-4">
        <div className="flex gap-4">
            <div>
                <p>Transaction</p>
                <h3 className="text-3xl font-semibold font-mono">
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
            <p className="font-mono">{shortenAddress(signer)}</p><GetIcon signer={signer} signers={data?.signed} />
        </div>)}
        <p className="text-lg flex">{data?.signed ? data.signed.length : <Loader />} out of {multisig.threshold} Neccessary Signatures Found</p>
        {
            sig_state === "alreadysigned" || sig_state === "loading" || sig_state === "loggedout" ?
            <Button disabled>
                {sig_state === "alreadysigned" ? "Already Signed" : sig_state === "loading" ? "Loading..." : "Logged Out"}
            </Button> :
            <Button onClick={async () => {
                const trx = data!.trx!

                if (sig_state === "combineable") {
                    // dont sign, just combine and submit
                    const combined_sig = await toast.promise(
                        combineSignatures({
                            multisig: multisig.address,
                            tx_hash
                        }).then(res => {
                            if (res.data?.combined) return res.data.combined
                            throw new Error("Error")
                        }),
                        {
                            loading: "Gathering Signatures",
                            success: "Got Transaction Signature",
                            error: "Error Getting Transaction Signatures"
                        }
                    )
                    await toast.promise(
                        sui_client.executeTransactionBlock({
                            signature: combined_sig,
                            transactionBlock: trx
                        }),
                        {
                            loading: "Submitting Transaction...",
                            success: "Submitted Transaction",
                            error: "Error Submitting Transaction"
                        }
                    )
                } else {
                    // sign trx
                    const signature = await dAppKit.signTransaction({ transaction: trx })

                    const tx_hash = await toast.promise(
                        addSignature({
                            tx: signature.bytes,
                            multisig: multisig.address,
                            signature: signature.signature
                        }).then(res => {
                            if (res.data?.tx_hash) {
                                return res.data.tx_hash
                            } else {
                                throw new Error("Error")
                            }
                        }),
                        {
                            loading: "Uploading Signature...",
                            error: "Error Uploading Signature",
                            success: "Uploaded Signature"
                        }
                    )
                    if (sig_state === "submitaftersign") {
                        // submit trx as well
                        const combined_sig = await toast.promise(
                            combineSignatures({
                                multisig: multisig.address,
                                tx_hash
                            }).then(res => {
                                if (res.data?.combined) return res.data.combined
                                throw new Error("Error")
                            }),
                            {
                                loading: "Gathering Signatures",
                                success: "Got Transaction Signature",
                                error: "Error Getting Transaction Signatures"
                            }
                        )
                        await toast.promise(
                            sui_client.executeTransactionBlock({
                                signature: combined_sig,
                                transactionBlock: trx
                            }),
                            {
                                loading: "Submitting Transaction...",
                                success: "Submitted Transaction",
                                error: "Error Submitting Transaction"
                            }
                        )
                    }
                }
            }}>
                {sig_state === "combineable" ?
                    "Submit Transaction" :
                    sig_state === "signeeded" ? "Sign Transaction" : "Sign and Submit"}
            </Button>
        }
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