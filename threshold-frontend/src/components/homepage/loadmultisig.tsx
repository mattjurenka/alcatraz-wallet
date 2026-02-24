"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input"
import { isValidSuiAddress } from "@mysten/sui/utils";
import { useAction } from "next-safe-action/hooks";
import toast from "react-hot-toast";
import { getMultisig } from "@/lib/actions";
import { useStore } from "@/lib/data";

export default function LoadMultisig() {
    const [isOpen, setIsOpen] = useState(false)
    const { executeAsync: executeGet, result: multisigResult } = useAction(getMultisig)
    const register_multisig = useStore(s => s.register_multisig)

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button size="lg" variant={"outline"} className="grow">Load Multisig</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Load Existing Multisig
                </DialogTitle>
            </DialogHeader>
            <form className="flex gap-4" onSubmit={async e => {
                e.preventDefault()
                const data = new FormData(e.target)
                const addr = data.get("address")?.toString()
                if (!addr || !isValidSuiAddress(addr)) return

                const multisig = await toast.promise(
                    executeGet({ address: addr }).then(d => {
                        if (d.data?.success) {
                            return d.data.multisig!
                        } else {
                            throw Error(d.data?.error)
                        }
                    }),
                    {
                        loading: "Getting Multisig...",
                        error: e => "Error: " + e,
                        success: d => "Loaded Multisig"
                    }
                )
                register_multisig(multisig)
                setIsOpen(false)
            }}>
                <Input name="address" placeholder={`Multisig Address`} />
                <Button type="submit">Load</Button>
            </form>
        </DialogContent>
    </Dialog>
}