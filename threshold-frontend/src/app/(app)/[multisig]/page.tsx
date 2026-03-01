"use client"

import ConnectWalletConnect from "@/components/dashboard/connectwalletconnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coinDataFetcher, trxHistoryFetcher, useStore } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";
import { CheckCircle2Icon, Copy, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr"
import { tr } from "zod/v4/locales";

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

const dateFormatter = new Intl.DateTimeFormat('en-US')

export default function Multisig() {
    const { multisig } = useParams<{ multisig: string }>()
    const [showAll, setShowall] = useState(false)
    const connected_multisig = useStore(s => s.connected_multisig)
    const multisigs = useStore(s => s.multisigs)
    const router = useRouter()
    
    const { data, isLoading } = useSWR({ address: multisig, fn: "coindata" }, coinDataFetcher)
    const filtered = data?.coins?.filter(coin => !coin.scam && coin.verified)
        ?.toSorted((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue) )

    const { data: trxHistoryData, isLoading: trxHistoryLoading } = useSWR({ address: multisig, fn: "history" }, trxHistoryFetcher)

    return <div className="px-2 sm:px-4 md:px-16 lg:px-32 2xl:px-[30%] h-full flex grow flex-col py-2 sm:py-16 gap-4">
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
                        <p className="ml-auto font-mono">{usdFormatter.format(parseFloat(coin.usdValue))}</p>
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
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {trxHistoryData?.data?.map(trx => <Link
            href={"https://suivision.xyz/txblock/" + trx.digest}
            key={trx.digest}
            target="_blank"
            className="flex gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md"
        >
            <p className="font-mono underline">{trx.digest.slice(0, 4)}...{trx.digest.slice(trx.digest.length - 4)}</p>
            <div>
                {trx.status === "success" ?
                    <CheckCircle2Icon className="text-green-600" /> :
                    <XCircle className="text-red-700" />}
            </div>
            <p className="ml-auto">
                {new Date(parseInt(trx.timestampMs)).toLocaleString()}
            </p>
        </Link>)}
        {multisigs[multisig] ? 
            <>
                <h3 className="text-lg font-semibold">Threshold: {multisigs[multisig].threshold} of {multisigs[multisig].signers.length} Signers</h3>
                {multisigs[multisig].signers.map(s => <p className="font-mono" key={s}>{shortenAddress(s)}</p>)}
            </> :
            <h3 className="text-lg font-semibold">Loading Multisig...</h3>}
        <h3 className="text-lg font-semibold">Sign Pending Transaction</h3>
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
    </div>
}