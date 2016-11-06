import * as _ from 'lodash'
import { promisifyAll } from 'bluebird'

declare var require: Function
const bitcore = require('bitcore-lib') as Bitcore
const Insight = require('bitcore-explorers').Insight
const qrcode = require('qrcode-terminal')

// Types
interface Bitcore {
  PrivateKey: any
  Transaction: any
  Address: any
  Unit: any

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
}

interface UnspentOutput {
  outputIndex: number
  satoshis: number
}

interface Transaction {
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

async function waitForTransaction(address: any) : Promise<any>{
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

async function run() {
  // Create funding address
  const fundingPrivateKey = new bitcore.PrivateKey() as PrivateKey
  const fundingAddress = fundingPrivateKey.toAddress()

  console.log("Send bitcoin to this address")
  console.log(fundingAddress.toString())
  qrcode.generate(fundingAddress.toString())

  try {
    const utxos = await waitForTransaction(fundingAddress)
    console.log("Address funded", utxos)

    const tokens = createPrivateKeys(10)
    const tokenPublicKeys = tokens.map(token => token.toPublicKey())
    const requiredTokens = 2

    const prizeAddress = new bitcore.Address(tokenPublicKeys, requiredTokens) as Address

    const fee = 6000
    const prizeAmount = totalAmount(utxos) - fee

    const transaction = (new bitcore.Transaction() as Transaction)
      .from(utxos)
      .fee(fee)
      .to(prizeAddress, prizeAmount)
      .sign(fundingPrivateKey)

    console.log("Broadcasting transaction")
    await insightPromise.broadcastAsync(transaction.serialize())
    console.log("Transaction broadcasted successfully")

  } catch(err) {
    console.error(err)
  }
}

run()
