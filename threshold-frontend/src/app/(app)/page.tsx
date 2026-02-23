"use client"
import CreateMultisig from "@/components/homepage/createmultisig";
import LoadMultisig from "@/components/homepage/loadmultisig";
import { registerMultisig, registerPubkey } from "@/lib/actions";
import { login_message } from "@/lib/constants";
import { useStore } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";
import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

export default function Home() {
	const multisigs = useStore(state => state.multisigs)
	//const dAppKit = useDAppKit();k
	//const account = useCurrentAccount()
	//const { execute, result } = useAction(registerPubkey)
	//const [n_sigs, set_n_sigs] = useState(2)
	//const [sigs, set_sigs] = useState({} as { [n: number]: string })
	//console.log(resultMultisig)

	//useEffect(() => {
	//	console.log(account?.address)
	//	if (account) {
	//		console.log("Requesting sign personal message")
	//		dAppKit.signPersonalMessage({message: new TextEncoder().encode(login_message)})
	//			.then(signed => {
	//				execute({
	//					address: account.address,
	//					signature: signed.signature,
	//				})
	//			})
	//	}
	//}, [account?.address])

	return (
		<div className="px-4 lg:px-[30%] h-full flex grow flex-col justify-center">
			{multisigs.size > 0 ?
			 	<div className="flex flex-col gap-4">
					<h2 className="text-lg font-semibold">Loaded Multisigs</h2>
					{Array.from(multisigs).map(multisig => <button id={multisig} className="rounded-md border border-black py-2 px-4 text-left cursor-pointer shadow-md">
						{shortenAddress(multisig)}
					</button>)}
				</div> :
				<p className="text-xl">You do not have any Alcatraz Wallets loaded. </p>}
			<div className="flex gap-4 mt-4">
				<CreateMultisig />
				<LoadMultisig />
			</div>
		</div>
	);
}
