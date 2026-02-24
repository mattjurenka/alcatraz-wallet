"use server"

import { createSafeActionClient } from "next-safe-action";
import { registerMultisigSchema, registerPubkeySchema, addSignatureSchema, Multisig, Signature, combineSignaturesSchema, getTxSignatureSchema, getMultisigSchema, getCoinDataSchema } from "./schemas";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { verifyPersonalMessageSignature, verifyTransactionSignature } from "@mysten/sui/verify"
import { login_message } from "./constants";
import { MultiSigPublicKey } from "@mysten/sui/multisig";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { hash } from "crypto";
import { fromBase64, isValidSuiAddress } from "@mysten/sui/utils";

const actionClient = createSafeActionClient();

export const registerPubkey = actionClient
    .inputSchema(registerPubkeySchema)
    .action(async ({ parsedInput: { pubkey }}) => {
        const env = getCloudflareContext().env as Env

        try {
            const ed_pubkey = new Ed25519PublicKey(pubkey)
            await env.THRESHOLD.put(`pubkey:${ed_pubkey.toSuiAddress()}`, ed_pubkey.toBase64())
            return { success: true }
        } catch (e) {
            console.error(e)
            return { success: false, error: "Invalid Pubkey", code: 0 }
        }
    })

export const registerMultisig = actionClient
    .inputSchema(registerMultisigSchema)
    .action(async ({ parsedInput: { addresses, threshold } }) => {
        const env = getCloudflareContext().env as Env
        addresses.sort()
        
        const results = [...(await env.THRESHOLD.get(addresses.map(a => `pubkey:${a}`))).values()]
        if (results.some(x => x === null)) {
            return { success: false, error: `Pubkey Not Found: connect with all addresses before using as signer.`, code: 1 }
        } else {
            const keys = (results as string[]).map(s => new Ed25519PublicKey(s))
            
            const multisig_pubkey = MultiSigPublicKey.fromPublicKeys({
                threshold,
                publicKeys: keys.map(k => ({ publicKey: k, weight: 1 }))
            })

            const address = multisig_pubkey.toSuiAddress()
            const multisig: Multisig = { threshold, signers: addresses, address, pubkey: multisig_pubkey.toBase64() }

            await env.THRESHOLD.put(`multisig:${address}`, JSON.stringify(multisig))

            return { success: true, multisig }
        }
    })

export const addSignature = actionClient
    .inputSchema(addSignatureSchema)
    .action(async ({ parsedInput: { multisig, signature, tx } }) => {
        const tx_hash = hash("sha256", tx)
        const env = getCloudflareContext().env as Env
        console.log(tx_hash, tx)

        await env.THRESHOLD.put(`transaction:${tx_hash}`, tx)

        const signers_result = await env.THRESHOLD.get(`multisig:${multisig}`, { type: "json" }) as Multisig | null
        if (!signers_result) {
            return { success: false, error: "Multisig not found", code: 2 }
        }

        const pubkey_results = [...(await env.THRESHOLD.get(signers_result.signers.map(a => `pubkey:${a}`))).values()] as string[]
        const pubkeys = pubkey_results.map(s => new Ed25519PublicKey(s))

        console.log(pubkeys.map(k => k.toSuiAddress()))
        
        const verified = await Promise.all(
            pubkeys.map(pubkey => verifyTransactionSignature(
                fromBase64(tx),
                signature,
                { address: pubkey.toSuiAddress() }
            )
                .then(verifies => ({
                    pubkey, verifies
                }))
                .catch(() => ({ pubkey, verifies: false }))
            )
        )
        console.log(verified)

        const pubkey = verified.find(({ verifies }) => verifies)?.pubkey

        if (pubkey) {
            await env.THRESHOLD.put(
                `multisig_sig:${multisig}:${tx_hash}:${signature}`,
                JSON.stringify({ signature, pubkey: pubkey.toBase64() } as Signature)
            )
            return { success: true, tx_hash }
        } else {
            return { success: false, error: "Invalid Pubkey", code: 3 }
        }
    })

export const combineSignatures = actionClient
    .inputSchema(combineSignaturesSchema)
    .action(async ({ parsedInput: { multisig, tx_hash } }) => {
        const env = getCloudflareContext().env as Env
        const signers_result = await env.THRESHOLD.get(`multisig:${multisig}`, { type: "json" }) as Multisig | null

        if (!signers_result) {
            return { success: false, error: "Multisig not found", code: 2 }
        }
        
        const { keys } = await env.THRESHOLD.list({ prefix: `multisig_sig:${multisig}:${tx_hash}` })

        console.log(keys)

        const sigs_result = await env.THRESHOLD.get(keys.map(k => k.name), { type: "json" }) as Map<string, Signature | null | undefined>
        const found_sigs = Array.from(sigs_result.values()).filter(v => v !== null && v !== undefined)
        if (found_sigs.length < signers_result.threshold) {
            return { success: false, error: "Not Enough Signatures", code: 4 }
        }

        const pubkey_results = [...(await env.THRESHOLD.get(signers_result.signers.map(a => `pubkey:${a}`))).values()] as string[]

        const multisig_pubkey = MultiSigPublicKey.fromPublicKeys({
            threshold: signers_result.threshold,
            publicKeys: pubkey_results
                .map(k => ({ publicKey: new Ed25519PublicKey(k), weight: 1 }))
                .toSorted(({ publicKey: pk1 }, { publicKey: pk2}) => pk1.toSuiAddress().localeCompare(pk2.toSuiAddress()))
        })

        console.log(multisig_pubkey.toSuiAddress())
        
        const combined = multisig_pubkey.combinePartialSignatures(found_sigs.map(s => s.signature))
        return { success: true, combined }
    })

export const getTransaction = actionClient
    .inputSchema(getTxSignatureSchema)
    .action(async ({ parsedInput: { tx_hash, multisig } }) => {
        const env = getCloudflareContext().env as Env
        console.log(tx_hash, multisig)

        const prefix = `multisig_sig:${multisig}:${tx_hash}`
        const [trx_result, sigs_result] = await Promise.all([
            env.THRESHOLD.get(`transaction:${tx_hash}`),
            env.THRESHOLD.list({ prefix })
        ])
        if (trx_result) {
            let signed = sigs_result.keys.map(k => new Ed25519PublicKey(k.name.substring(145)).toSuiAddress())
            return { success: true, trx: trx_result, signed }
        } else {
            return { success: false, error: "Transaction Not Found", code: 5 }
        }
    })

export const getMultisig = actionClient
    .inputSchema(getMultisigSchema)
    .action(async ({ parsedInput: { address } }) => {
        const env = getCloudflareContext().env as Env

        const multisig_result = await env.THRESHOLD.get(`multisig:${address}`, { type: "json" }) as Multisig
        if (multisig_result) {
            return { success: true, multisig: multisig_result }
        } else {
            return { success: false, error: "Multisig Not Found", code: 2 }
        }
    })

interface BlockVisionCoin {
    coinType: string,
    balance: string,
    decimals: number,
    logo: string,
    name: string,
    price: string,
    scam: boolean
    symbol: string,
    usdValue: string,
    verified: boolean
}

interface BlockVisionCoins {
    coins: BlockVisionCoin[]
    usdValue: string
}

export const getCoinData = actionClient
    .inputSchema(getCoinDataSchema)
    .action(async ({ parsedInput: { address } }) => {
        if (!isValidSuiAddress(address)) {
            return
        }
        console.log("getting data for", address)
        const env = getCloudflareContext().env as Env
        const response = await fetch(
            `https://api.blockvision.org/v2/sui/account/coins?account=${address}`,
            {
                headers: {
                    "Accept": "application/json",
                    "X-Api-Key": env.BLOCKVISION_KEY
                }
            }
        )

        const json = ((await response.json()) as any)
        return json.result as BlockVisionCoins
    })
