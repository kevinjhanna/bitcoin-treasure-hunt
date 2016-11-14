/// <reference path="./../bitcore-lib/index.d.ts" />
import bitcore = require('bitcore-lib')

export interface TreasureHunt {
  transacation: bitcore.Transaction
  tokens: bitcore.PrivateKey[]
  prizeAddress: bitcore.Address
  prizeAmount: number
}

export interface Funding {
  address: bitcore.Address
  privateKey: bitcore.PrivateKey
}

export function createFunding(): Funding

export function waitForTransaction(address: bitcore.Address): Promise<bitcore.UnspentOutput[]>

export function createTreasureHunt(utxos: bitcore.UnspentOutput[], funding: Funding, options: { tokens: { total: number; required: number }}): TreasureHunt

export function broadcastTreasureHunt(treasureHunt: TreasureHunt): Promise<void>

export function redeem(options: {transactionId: string, prizeAddress: bitcore.Address, amount: number, publicKeys: bitcore.PublicKey[], tokens: bitcore.PrivateKey[], address: bitcore.Address }) : Promise<void>
