import * as _ from 'lodash'
import { promisifyAll } from 'bluebird'

declare var require: Function
const bitcore = require('bitcore-lib') as Bitcore
const Insight = require('bitcore-explorers').Insight
const qrcode = require('qrcode-terminal')

const FEE = 6000 // satoshis

// Types
interface Bitcore {
  PrivateKey: any
  Transaction: any
  Address: any
  Unit: any
  Script: any

  Networks: {
    defaultNetwork: any
    testnet: any
  }
}

interface Address {
  toString: () => string
}

interface PublicKey {
}

interface PrivateKey {
  toAddress: () => Address
  toPublicKey: () => PublicKey
  toWIF: () => string
  // fromWIF: (wif: string) => PrivateKey
}

interface UnspentOutput {
  txId: string
  outputIndex: number
  satoshis: number
  address: Address
  script: string
}

interface Transaction {
  id: string
  from: (utxos: any, publicKeys?: PublicKey[], treshold?: number) => Transaction
  to: (address: Address, amount: number) => Transaction
  change: (address: Address) => Transaction
  fee: (fee: number) => Transaction
  sign: (privateKeys: PrivateKey | PrivateKey[]) => Transaction
  serialize: () => string
}

// Use testnet
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet
const insight = new Insight('testnet')

const insightPromise = promisifyAll(insight) as {
  getUnspentUtxosAsync: (foo:any) => any
  broadcastAsync: (transaction: string) => any
}

function delay(ms: number) {
 return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForTransaction(address: Address) : Promise<any>{
  const utxos = await insightPromise.getUnspentUtxosAsync(address)

  if (_.isEmpty(utxos)) {
    console.log("No funds... Still waiting...")

    await delay(4000)
    return waitForTransaction(address)

  } else {
    return Promise.resolve(utxos)
  }
}


function createPrivateKeys(n: number) {
  return _.chain(n)
    .range()
    .map(_ => new bitcore.PrivateKey() as PrivateKey)
    .value()
}

// In satoshis
function totalAmount(utxos: UnspentOutput[]) : number {
  return _.chain(utxos)
    .map(utxo => utxo.satoshis)
    .sum()
    .value()
}

async function redeem(transactionId: string, fromAddress: Address, amount: number, publicKeys: PublicKey[], tokens: PrivateKey[], address: Address) {
  const prizeAmount = amount - FEE

  const utxo : UnspentOutput = {
    txId : transactionId,
    outputIndex : 0,
    address : fromAddress.toString(),
    script : new bitcore.Script(fromAddress).toHex(),
    satoshis : amount,
  }

  const transaction = (new bitcore.Transaction() as Transaction)
    .from(utxo, publicKeys, tokens.length)
    .fee(FEE)
    .to(address, prizeAmount)
    .sign(tokens)

  await insightPromise.broadcastAsync(transaction.serialize())
  console.log("Redeemed treasure")
}

async function run() {
  // Create funding address
  const fundingPrivateKey = new bitcore.PrivateKey() as PrivateKey
  const fundingAddress = fundingPrivateKey.toAddress()

  console.log("Send bitcoin to this address")
  qrcode.generate(fundingAddress.toString())

  try {
    const utxos = await waitForTransaction(fundingAddress)
    console.log("Address funded", utxos)

    const tokens = createPrivateKeys(10)
    const tokenPublicKeys = tokens.map(token => token.toPublicKey())
    const requiredTokens = 2

    const prizeAddress = new bitcore.Address(tokenPublicKeys, requiredTokens) as Address

    const prizeAmount = totalAmount(utxos) - FEE

    const transaction = (new bitcore.Transaction() as Transaction)
      .from(utxos)
      .fee(FEE)
      .to(prizeAddress, prizeAmount)
      .sign(fundingPrivateKey)

    console.log("Broadcasting transaction")
    await insightPromise.broadcastAsync(transaction.serialize())
    console.log("Transaction broadcasted successfully")

    // Once somebody founds the requiredTokens
    await redeem(transaction.id, prizeAddress, prizeAmount, tokenPublicKeys, [tokens[0], tokens[1]], 'n49hbHgynpRK3eZdas1p52DCt8bHrY51oD')

  } catch(err) {
    console.error(err.stack)
  }
}

run()
