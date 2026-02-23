"use client"
import { ConnectButton } from "@mysten/dapp-kit-react";

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
    return <div className="flex flex-col min-h-screen">
        <div className="flex py-4 items-center gap-2 px-4 lg:px-[30%] border-b-2">
            <img src="/alcatraz.svg" className="w-12 h-12"/>
            <h1 className="font-bold text-xl">Alcatraz Wallet</h1>
            <div className="ml-auto">
                <ConnectButton />
            </div>
        </div>
        {children}
        <div className="flex py-4 items-center gap-2 px-4 lg:px-[30%] border-t-2">
            <a href="https://github.com/mattjurenka/" className="font-medium underline">GitHub</a>
            <p className="ml-auto font-medium">Made with Love by Matthew Jurenka</p>
        </div>
    </div>
}