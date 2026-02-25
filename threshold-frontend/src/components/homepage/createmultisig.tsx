"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Form } from "@/components/ui/form"
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { registerMultisig } from "@/lib/actions";
import { isValidSuiAddress } from "@mysten/sui/utils";
import toast from "react-hot-toast";
import { shortenAddress } from "@/lib/utils";
import { useStore } from "@/lib/data";

const max_signers = 8
const min_signers = 2

const min_threshold = 1

export default function CreateMultisig() {
    const [nSigners, setNSigners] = useState(2)
    const [isOpen, setIsOpen] = useState(false)
    const [threshold, setThreshold] = useState(1)

    const { executeAsync: executeRegister, result: multisigResult } = useAction(registerMultisig)
    const register_multisig = useStore(s => s.register_multisig)

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button size="lg" className="grow">Create Multisig</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Create New Multisig
                </DialogTitle>
            </DialogHeader>
                <form
                    onSubmit={async e => {
                        e.preventDefault()
                        const data = new FormData(e.target)
                        const addresses = Array.from({length: nSigners}).map((_, i) => data.get("addr-" + i))
                        const filtered = addresses.filter(a => a !== null && isValidSuiAddress(a.toString())) as string[]
                        const unique = new Set(filtered)
                        if (filtered.length !== addresses.length || unique.size !== filtered.length) {
                            console.log("Bad!")
                            return
                        }

                        const created_multisig = await toast.promise(
                            executeRegister({
                                addresses: filtered,
                                threshold: parseInt(data.get("threshold")!.toString())
                            }).then(r => {
                                const data = r.data
                                if (!data) {
                                    throw new Error("Unknown Server Error")
                                } else {
                                    if (data.success) {
                                        return data.multisig!
                                    } else {
                                        throw new Error(data.error)
                                    }
                                }
                            }),
                            {
                                loading: "Registering Multisig...",
                                success: a => `Registered Address ${shortenAddress(a.address)}`,
                                error: e => `Failed to Register: ${e}`
                            },
                        )
                        register_multisig(created_multisig)
                        setIsOpen(false)
                    }}
                    className="flex flex-col sm:gap-4 gap-2"
                >
                    <div className="flex gap-2">
                        <button type="button" className="cursor-pointer" onClick={() => {
                            setNSigners(Math.max(min_signers, nSigners - 1))
                            setThreshold(Math.min(threshold, nSigners - 1))
                        }}><Minus /></button>
                        <p>{nSigners}</p>
                        <button type="button" className="cursor-pointer" onClick={() => {
                            setNSigners(Math.min(max_signers, nSigners + 1))
                        }}><Plus /></button>
                    </div>
                    {Array.from({ length: nSigners }).map((_, i) => {
                        return <Input name={`addr-${i}`} key={i} placeholder={`Signer Address #${i + 1}`} />
                    })}
                    <p className="font-semibold">Threshold</p>
                    <div className="flex gap-2">
                        <button type="button" className="cursor-pointer" onClick={() => {
                            setThreshold(Math.max(min_threshold, threshold - 1))
                        }}><Minus /></button>
                        <p>{threshold}</p>
                        <input value={threshold} readOnly name="threshold" className="hidden"></input>
                        <button type="button" className="cursor-pointer" onClick={() => {
                            setThreshold(Math.min(nSigners, threshold + 1))
                        }}><Plus /></button>
                    </div>
                    <Button type="submit">Create</Button>
                </form>
        </DialogContent>
    </Dialog>
}