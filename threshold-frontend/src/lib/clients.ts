"use client"

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export const sui_client = new SuiJsonRpcClient({
	url: getJsonRpcFullnodeUrl("mainnet"),
	network: 'mainnet', // Required
});
