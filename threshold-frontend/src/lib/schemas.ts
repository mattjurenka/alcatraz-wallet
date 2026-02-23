import { z } from "zod";

export const registerPubkeySchema = z.object({
  signature: z.string(),
  address: z.string()
});

export const registerMultisigSchema = z.object({
  addresses: z.array(z.string()),
  threshold: z.int().positive()
});

export const addSignatureSchema = z.object({
  tx: z.string(),
  signature: z.string(),
  multisig: z.string(),
})

export const combineSignaturesSchema = z.object({
  multisig: z.string(),
  tx_hash: z.string()
})

export const getTxSignatureSchema = z.object({
  tx_hash: z.string()
})

export interface Multisig {
  threshold: number,
  addresses: string[]
}

export interface Signature {
  signature: string,
  pubkey: string
}
