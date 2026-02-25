"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/data";
import { Suspense, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { addSignature } from "@/lib/actions"
import { shortenAddress } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Transaction } from "@mysten/sui/transactions";
import { sui_client } from "@/lib/clients";

export default function SuggestSignature() {
    const set_on_sig_suggested = useStore(s => s.set_on_sig_suggested)
    const connected_multisig = useStore(s => s.connected_multisig)
    const router = useRouter()
    const account = useCurrentAccount()
    
    const is_signer = !!(connected_multisig && account && connected_multisig.signers.some(s => s === account.address))

    const [trx, setTrx] = useState<string | null>(null)
    const dAppKit = useDAppKit()
    
    useEffect(() => {
        set_on_sig_suggested(async trx => {
            try {
                JSON.parse(trx)
                setTrx(trx)
            } catch (e) {
                const deserialized = await Transaction.from(trx).toJSON({ client: sui_client })
                setTrx(deserialized)
            }
        })
    }, [set_on_sig_suggested])

    return <Dialog open={!!trx} onOpenChange={o => setTrx(null)}>
        <DialogContent className="max-h-screen overflow-y-scroll">
            <DialogHeader>
                <DialogTitle>
                    A Signature Has Been Requested
                </DialogTitle>
            </DialogHeader>
            { is_signer ? <>
                <p>For Multisig {shortenAddress(connected_multisig?.address || "")}</p>
                <code className="flex w-full overflow-scroll font-mono">
                    {JSON.stringify(JSON.parse(trx!), undefined, 4)}
                </code>
                <Suspense>

                </Suspense>
                <div className="flex gap-4 w-full">
                    <Button variant={"destructive"} className="grow" onClick={async () => {
                        if (!trx) return
                        const signature = await dAppKit.signTransaction({ transaction: trx })

                        const tx_hash = await toast.promise(
                            addSignature({
                                tx: signature.bytes,
                                multisig: connected_multisig!.address,
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
                        router.push("/" + connected_multisig!.address + "/" + tx_hash)
                        setTrx(null)
                    }}>Sign</Button>
                    <Button variant={"outline"} className="grow" onClick={() => setTrx(null)}>Cancel</Button>
                </div>
                </> :
                <>
                    <p>To Sign this Transaction you must be connected as a signer of the wallet</p>
                    <ConnectButton />
                </>
            }
        </DialogContent>
    </Dialog>
}
