"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input"

export default function LoadMultisig() {
    const [isOpen, setIsOpen] = useState(false)

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button size="lg" variant={"outline"}>Load Multisig</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Load Existing Multisig
                </DialogTitle>
            </DialogHeader>
            <form className="flex gap-4">
                <Input name="address" placeholder={`Multisig Address`} />
                <Button type="submit">Load</Button>
            </form>
        </DialogContent>
    </Dialog>
}