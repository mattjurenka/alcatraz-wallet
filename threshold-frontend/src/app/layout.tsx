"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { type DAppKit } from "@mysten/dapp-kit-react";
import { Toaster } from "react-hot-toast"
import { useStore } from "@/lib/data";
import Core from "@walletconnect/core";
import WalletKit from "@reown/walletkit";

const DAppKitProvider = dynamic(
	() => import("@mysten/dapp-kit-react").then(mod => mod.DAppKitProvider),
	{ssr: false}
)
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const GRPC_URLS: { [network: string]: string } = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const load_localstorage = useStore(s => s.load_localstorage)
	const init_walletkit = useStore(s => s.init_walletkit)
	const set_wallet_kit = useStore(s => s.set_wallet_kit)

	const [dAppKit, setDAppKit] = useState<DAppKit<string[], SuiGrpcClient> | null>(null)
	useEffect(() => {
		const core = new Core({
			projectId: "805bd4ade75ef7e76aa7427521732faf",
		});

		WalletKit.init({
			core,
			metadata: {
				name: "Alcatraz Wallet",
				description: "Multisig for Sui",
				url: "https://alcatraz.kinecta.app",
				icons: []
			}
		}).then(wk => {
			set_wallet_kit(wk)
			init_walletkit()
		})

		load_localstorage()

		;(async () => {
			const { createDAppKit } = await import("@mysten/dapp-kit-react")

			console.log("Creating dApp Kit")

			setDAppKit(createDAppKit({
				networks: ['mainnet'],
				createClient: (network) => new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
			}));
		})()
	}, [])

	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
				<title>Alcatraz Wallet</title>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Toaster />
				{dAppKit && <DAppKitProvider dAppKit={dAppKit}>
					{children}
				</DAppKitProvider>}
			</body>
		</html>
	);
}
