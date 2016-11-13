import bitcore = require('bitcore-lib')

export interface TreasureHunt {
  transacation: bitcore.Transaction
  tokens: bitcore.PrivateKey[]
  prizeAddress: bitcore.Address
  prizeAmount: number
}

export function createTreasureHunt(utxos: bitcore.UnspentOutput[], privateKey: bitcore.PrivateKey, options: { tokens: { total: number; required: number }}) : TreasureHunt

export function waitForTransaction(address: bitcore.Address) : Promise<bitcore.UnspentOutput[]>