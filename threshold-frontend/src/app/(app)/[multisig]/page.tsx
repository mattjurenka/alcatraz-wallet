"use client"

import ConnectWalletConnect from "@/components/dashboard/connectwalletconnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coinDataFetcher, useStore } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr"

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

export default function Multisig() {
    const { multisig } = useParams<{ multisig: string }>()
    const [showAll, setShowall] = useState(false)
    const connected_multisig = useStore(s => s.connected_multisig)
    const multisigs = useStore(s => s.multisigs)
    const router = useRouter()
    
    const { data, isLoading } = useSWR(multisig, coinDataFetcher)
    const filtered = data?.coins?.filter(coin => !coin.scam && coin.verified)
        ?.toSorted((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue) )

    return <div className="px-2 sm:px-4 lg:px-[30%] h-full flex grow flex-col py-2 sm:py-16 gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-baseline sm:items-center">
            <div>
                <p>Wallet</p>
                <p className="text-xl sm:text-3xl font-semibold">
                    {shortenAddress(multisig)}
                    <button className="cursor-pointer ml-4" onClick={() => navigator.clipboard.writeText(multisig)}>
                        <Copy />
                    </button>
                </p>
            </div>
            <div className="sm:ml-auto">
                {connected_multisig ?
                    <Button variant={"outline"}>Disconnect</Button> :
                    <ConnectWalletConnect multisig={multisig}/>
                }
            </div>
        </div>
        <h3 className="text-lg font-semibold">Coins</h3>
        {filtered ?
            <div className="flex flex-col gap-2">
                {filtered
                    .slice(0, showAll ? undefined : 10)
                    .map(coin => <div key={coin.coinType} className={"flex items-center gap-2"}>
                        <img src={coin.logo} className="w-8 h-8" />
                        <p className="">{coin.name}</p>
                        <p className="ml-auto">{usdFormatter.format(parseFloat(coin.usdValue))}</p>
                    </div>)}
                {filtered.length == 0 && <p className="text-center my-4">No Coins Found</p>}
                {filtered.length > 10 ?
                    <Button variant={"outline"} onClick={() => setShowall(!showAll)}>
                        {showAll ? "Hide" : "Show"} Remaining
                    </Button> :
                    <></>}
            </div>:
            isLoading ? 
                <p className="text-center my-4">Loading...</p> :
                <></>}
        <h3 className="text-lg font-semibold">Transactions</h3>
        <form className="flex flex-col sm:flex-row gap-4" onSubmit={e => {
            e.preventDefault()
            const form_data = new FormData(e.target)

            const tx_hash = form_data.get("tx_hash")?.toString()

            if (!tx_hash || tx_hash.length !== 64) return
            router.push(`/${multisig}/${tx_hash}`)
        }}>
            <Input name="tx_hash" placeholder="Enter Alcatraz Transaction ID" />
            <Button>View Transaction</Button>
        </form>
        <h3 className="text-lg font-semibold">Threshold: {multisigs[multisig].threshold} of {multisigs[multisig].signers.length} Signers</h3>
        {multisigs[multisig].signers.map(s => <p className="font-mono" key={s}>{shortenAddress(s)}</p>)}
    </div>
}