"use client"
import CreateMultisig from "@/components/homepage/createmultisig";
import LoadMultisig from "@/components/homepage/loadmultisig";
import { useStore } from "@/lib/data";
import { Multisig } from "@/lib/schemas";
import { shortenAddress } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
	const multisigs = Object.values(useStore(state => state.multisigs))

	return (
		<div className="px-2 sm:px-4 lg:px-32 2xl:px-[30%] h-full flex grow flex-col pt-4">
			{multisigs.length > 0 ?
			 	<div className="flex flex-col gap-4">
					<h2 className="text-lg font-semibold">Loaded Multisigs</h2>
					{multisigs.map(multisig => <Link key={multisig.address} href={"/" + multisig.address} id={multisig.address} className="rounded-md border border-black py-2 px-2 sm:px-4 text-left shadow-md flex">
						<p className="text-sm font-mono">{shortenAddress(multisig.address)}</p>
						<p className="text-sm ml-auto">Threshold: {multisig.threshold} of {multisig.signers.length}</p>
					</Link>)}
				</div> :
				<p className="text-xl">You do not have any Alcatraz Wallets loaded. </p>}
			<div className="flex gap-4 mt-4">
				<CreateMultisig />
				<LoadMultisig />
			</div>
		</div>
	);
}
