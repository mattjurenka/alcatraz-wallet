"use client"

import { create } from "zustand"
import { Multisig } from "./schemas"
import { getCoinData, getTransaction, getTransactionHistory } from "./actions"
import WalletKit from "@reown/walletkit"
import { SafeActionResult, ValidationErrors } from "next-safe-action"
import z, { ZodObject } from "zod"

interface State {
    multisigs: {[addr: string]: Multisig},
    wallet_kit: WalletKit | null,
    connected_multisig: Multisig | null,
    on_sig_suggested: (trx: string) => void

    register_multisig: (multisig: Multisig) => void
    set_wallet_kit: (wk: WalletKit) => void
    set_on_sig_suggested: (fn: (trx: string) => void) => void
    connect_multisig: (multisig: Multisig, uri: string) => Promise<void>
    load_localstorage: () => void
    init_walletkit: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
    multisigs: {},
    wallet_kit: null,
    connected_multisig: null,
    on_sig_suggested: () => {},

    register_multisig: (multisig) => {
        set(state => {
            const new_state = { ...state.multisigs, [multisig.address]: multisig }
            localStorage.setItem("multisigs", JSON.stringify(new_state))
            return { multisigs: new_state }
        })
    },
    set_on_sig_suggested: (fn) => set({ on_sig_suggested: fn }),
    connect_multisig: async (multisig, uri) => {
        const wk = get().wallet_kit!
        await wk.pair({ uri })
        set({ connected_multisig: multisig })
    },
    load_localstorage: () => {
        const stored_multisigs = localStorage.getItem("multisigs")
        if (stored_multisigs) {
            let multisigs = JSON.parse(stored_multisigs)
            set({ multisigs })
        }
    },
    set_wallet_kit: wk => set({ wallet_kit: wk }),
    init_walletkit: async () => {
        console.log("Initializing Walletkit")
        const { wallet_kit } = get()
        const wk = wallet_kit!
        
        wk.on("session_request", async requestEvent => {
            const connected_multisig = get().connected_multisig
            if (!connected_multisig) throw new Error('asddja')

            console.log("Received request", requestEvent)
            const { id, params, topic, verifyContext } = requestEvent
            const { request } = params

            if (request.method === "sui_getAccounts") {
                console.log("sending accs", connected_multisig)
                await wk.respondSessionRequest({
                    topic: topic,
                    response: {
                        id,
                        jsonrpc: "2.0",
                        result: [{ pubkey: connected_multisig.pubkey, address: connected_multisig.address }]
                    }
                })
            } else if (request.method === "sui_signTransaction") {
                const { transaction, address } = request.params as { transaction: string, address: string }
                const state = get()
                if (address !== state.connected_multisig?.address) return
                
                state.on_sig_suggested(transaction)
            }
        })

        wk.on("session_proposal", async proposal => {
            const connected_multisig = get().connected_multisig!
            console.log("Received session proposal:", proposal, connected_multisig)
            if (!connected_multisig) return

            const session = await wk.approveSession({
                id: proposal.id,
                namespaces: {
                    sui: {
                        accounts: ["sui:mainnet:" + connected_multisig.address],
                        methods: ["sui_getAccounts", "sui_signTransaction", "sui_signAndExecuteTransaction", "sui_signPersonalMessage"],
                        events: []
                    }
                }
            })
            console.log("Approved Session:", session)

            await wk.respondSessionRequest({
                topic: session.topic,
                response: {
                    id: proposal.id,
                    result: "session approved",
                    jsonrpc: "2.0"
                }
            })
            console.log("responded to session request")

        })
    }
}))

export const get_fetcher = <S extends ZodObject<any, any>, R>(action: (args: z.infer<S>) => Promise<SafeActionResult<string, S, ValidationErrors<S>, R>>): ((args: z.infer<S>) => Promise<R>) =>  {
    return async (a) => {
        const { data, serverError, validationErrors } = await action(a)
        if (serverError) throw new Error(serverError)
        if (validationErrors) throw new Error(JSON.stringify(validationErrors))
        if (!data) throw new Error("No Data and No Errors")
        return data
    }
}

export const coinDataFetcher = get_fetcher(getCoinData)
export const trxDataFetcher = get_fetcher(getTransaction)
export const trxHistoryFetcher = get_fetcher(getTransactionHistory)
