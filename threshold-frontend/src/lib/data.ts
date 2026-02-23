import { create } from "zustand"

interface State {
    multisigs: Set<string>
    register_multisig: (multisig: string) => void
    load_localstorage: () => void
}

export const useStore = create<State>((set, get) => ({
    multisigs: new Set(),
    register_multisig: (addr) => {
        set(state => {
            const s = new Set(state.multisigs)
            s.add(addr)
            return { multisigs: s }
        })
        const state = get()
        localStorage.setItem("multisigs", JSON.stringify(Array.from(state.multisigs)))
    },
    load_localstorage: () => {
        const stored = localStorage.getItem("multisigs")
        if (!stored) return

        let multisigs = new Set(JSON.parse(stored) as string[])
        set({ multisigs })
    }
}))




