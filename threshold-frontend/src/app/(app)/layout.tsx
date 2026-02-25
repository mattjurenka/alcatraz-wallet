"use client"
import { registerPubkey } from "@/lib/actions";
import { login_message } from "@/lib/constants";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { bcs } from "@mysten/sui/bcs";
import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { fromBase64, toBase58, toBase64 } from "@mysten/sui/utils";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect } from "react";
import { decodeSuiPrivateKey, PublicKey } from "@mysten/sui/cryptography"
import toast from "react-hot-toast";
import { useStore } from "@/lib/data";
import { Network } from "lucide-react";
import SuggestSignature from "@/components/suggestsignature";

function parsePublicKey(bytes: Uint8Array<ArrayBufferLike>): PublicKey {
    const flag = bytes[0]
    if (flag == 0x00) {
        return new Ed25519PublicKey(bytes.subarray(1))
    }
    throw new Error("Invalid Flag " + flag)
}

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
    const account = useCurrentAccount()
    const dAppKit = useDAppKit()
	const { executeAsync: executeRegister, result } = useAction(registerPubkey)
    const connected_multisig = useStore(s => s.connected_multisig)

    useEffect(() => {
        const addr = account?.address
        console.log("acc changed", addr)
        if (addr) {
            ;(async () => {
                const key = `authed:${addr}`
                const authed = localStorage.getItem(key)
                if (authed) return

                try {
                    const pubkey = parsePublicKey(Buffer.from(account.publicKey))
                    await toast.promise(
                        executeRegister({ pubkey: pubkey.toBase64() }),
                        {
                            loading: "Registering Signer Wallet...",
                            success: "Registered Signer",
                            error: "Error Registering"
                        }
                    )
                    localStorage.setItem(key, "true")
                } catch (e) {
                    if (!authed) {
                        const signature = await dAppKit.signPersonalMessage({
                            message: new TextEncoder().encode(login_message)
                        })
                        const pubkey = await verifyPersonalMessageSignature(
                            fromBase64(signature.bytes),
                            signature.signature
                        )

                        await toast.promise(
                            executeRegister({ pubkey: pubkey.toBase64() }),
                            {
                                loading: "Registering Signer Wallet...",
                                success: "Registered Signer",
                                error: "Error Registering"
                            }
                        )
                        localStorage.setItem(key, "true")
                    }
                }
            })()
        }

    }, [account?.address])

    return <>
        <SuggestSignature />
        <div className="flex flex-col min-h-screen">
            <div className="flex py-2 sm:py-4 items-center gap-2 px-2 sm:px-4 md:px-16 lg:px-32 2xl:px-[30%] border-b-2">
                <Link href="/" className="flex gap-2 items-center">
                    <img src="/alcatraz.svg" className="w-10 h-10 sm:w-12 sm:h-12"/>
                    <h1 className="font-bold sm:text-xl">Alcatraz Wallet</h1>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                    {connected_multisig && <Link href={`/${connected_multisig.address}/`} className="text-green-600 flex">
                        <Network className="w-6 sm:w-12" />
                        <p className="mr-4 hidden sm:block font-semibold">Connected To Dapp</p>
                    </Link>}
                    <ConnectButton className="text-sm sm:text-lg" />
                </div>
            </div>
            {children}
            <div className="flex py-2 sm:py-4 items-center gap-2 px-2 sm:px-4 md:px-16 lg:px-32 2xl:px-[30%] border-t-2">
                <a href="https://github.com/mattjurenka/alcatraz-wallet" className="font-medium underline">GitHub</a>
                <p className="ml-auto text-sm sm:text-base font-medium">Made with Love by Kinecta Telecom</p>
            </div>
        </div>
    </>
}