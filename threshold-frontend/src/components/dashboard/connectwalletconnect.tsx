"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { useStore } from "@/lib/data";

export default function ConnectWalletConnect({ multisig }: { multisig: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const connect_multisig = useStore(s => s.connect_multisig)
    const multisigs = useStore(s => s.multisigs)

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button size="lg" variant={"default"}>Connect To DApp</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Connect to DApp
                </DialogTitle>
            </DialogHeader>
            <form className="flex gap-4" onSubmit={async e => {
                e.preventDefault()
                const data = new FormData(e.target)
                const uri = data.get("uri")?.toString()
                if (!uri) return 

                await connect_multisig(multisigs[multisig], uri)

                setIsOpen(false)
            }}>
                <Input name="uri" placeholder={`Enter WalletConnect URI`} />
                <Button type="submit">Connect</Button>
            </form>
        </DialogContent>
    </Dialog>
}