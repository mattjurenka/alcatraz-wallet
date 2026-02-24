import { z } from "zod";

export const registerPubkeySchema = z.object({
  pubkey: z.string(),
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
  multisig: z.string(),
  tx_hash: z.string()
})

export const getMultisigSchema = z.object({
  address: z.string()
})

export const getCoinDataSchema = z.object({
  address: z.string()
})

export interface Multisig {
  threshold: number,
  signers: string[],
  address: string
  pubkey: string
}

export interface Signature {
  signature: string,
  pubkey: string
}
