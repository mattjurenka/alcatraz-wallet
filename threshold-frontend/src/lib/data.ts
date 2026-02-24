import { create } from "zustand"
import { Multisig } from "./schemas"
import { getCoinData, getTransaction } from "./actions"
import WalletKit from "@reown/walletkit"
import Core from "@walletconnect/core"

interface State {
    multisigs: {[addr: string]: Multisig},
    wallet_kit: Promise<WalletKit>,
    connected_multisig: Multisig | null,
    on_sig_suggested: (trx: string) => void

    register_multisig: (multisig: Multisig) => void
    set_on_sig_suggested: (fn: (trx: string) => void) => void
    connect_multisig: (multisig: Multisig, uri: string) => Promise<void>
    load_localstorage: () => void
    init_walletkit: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
    multisigs: {},
    wallet_kit: (() => {
        const core = new Core({
            projectId: "805bd4ade75ef7e76aa7427521732faf",
        });

        return WalletKit.init({
            core,
            metadata: {
                name: "Alcatraz Wallet",
                description: "Multisig for Sui",
                url: "https://threshold.kinecta.app",
                icons: []
            }
        })
    })(),
    connected_multisig: null,
    on_sig_suggested: () => {},

    register_multisig: (multisig) => {
        set(state => {
            const new_state = { ...state.multisigs, [multisig.address]: multisig }
            localStorage.setItem("multisigs", JSON.stringify(new_state))
            return new_state
        })
    },
    set_on_sig_suggested: (fn) => set({ on_sig_suggested: fn }),
    connect_multisig: async (multisig, uri) => {
        const wk = await get().wallet_kit
        set({ connected_multisig: multisig })
        await wk.pair({ uri })
    },
    load_localstorage: () => {
        const stored_multisigs = localStorage.getItem("multisigs")
        if (stored_multisigs) {
            let multisigs = JSON.parse(stored_multisigs)
            set({ multisigs })
        }
    },
    init_walletkit: async () => {
        (await get().wallet_kit)
            .on("session_proposal", async proposal => {
                const { connected_multisig, wallet_kit } = get()
                const wk = await wallet_kit
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

                wk.on("session_request", async requestEvent => {
                    const { id, params, topic, verifyContext } = requestEvent
                    const { request } = params
                    if (topic !== session.topic) return
                    console.log("Received request", request)

                    if (request.method === "sui_getAccounts") {
                        await wk.respondSessionRequest({
                            topic: session.topic,
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

                await wk.respondSessionRequest({
                    topic: session.topic,
                    response: {
                        id: proposal.id,
                        result: "session approved",
                        jsonrpc: "2.0"
                    }
                })

            })
    }
}))

export const coinDataFetcher = async (address: string) => {
    const { data, serverError, validationErrors } = await getCoinData({ address })
    console.log("data", data)
    if (serverError) throw new Error(serverError)
    if (validationErrors) throw new Error(JSON.stringify(validationErrors))
    return data
}

export const trxDataFetcher = async ([multisig, tx_hash]: [string, string]) => {
    const { data, serverError, validationErrors } = await getTransaction({ multisig, tx_hash })
    if (serverError) throw new Error(serverError)
    if (validationErrors) throw new Error(JSON.stringify(validationErrors))
    return data
}

