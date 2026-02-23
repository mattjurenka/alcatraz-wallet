import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";


export const sui_client = new SuiJsonRpcClient({
	url: getJsonRpcFullnodeUrl("mainnet"),
	network: 'mainnet', // Required
});

export const core = new Core({
  projectId: "805bd4ade75ef7e76aa7427521732faf",
});

export const wallet_kit = await WalletKit.init({
	core,
	metadata: {
		name: "Alcatraz Wallet",
		description: "Multisig for Sui",
		url: "https://threshold.kinecta.app",
		icons: []
	}
})
