import * as _ from 'lodash'
import { promisifyAll } from 'bluebird'
import bitcore = require('bitcore-lib')
import { TreasureHunt } from './bitcoin-treasure-hunt'

declare var require: Function
const Insight = require('bitcore-explorers').Insight
const qrcode = require('qrcode-terminal')
const insight = new Insight('testnet')

const FEE = 6000 // satoshis

// Use testnet
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet

const insightPromise = promisifyAll(insight) as {
  getUnspentUtxosAsync: (foo:any) => any
  broadcastAsync: (transaction: string) => any
}

const delay = (ms: number) => {
 return new Promise(resolve => setTimeout(resolve, ms))
}

export const waitForTransaction = async (address: bitcore.Address) : Promise<bitcore.UnspentOutput[]> => {
  const utxos = await insightPromise.getUnspentUtxosAsync(address)

  if (_.isEmpty(utxos)) {
    console.log("No funds... Still waiting...")

    await delay(4000)
    return waitForTransaction(address)

  } else {
    return Promise.resolve(utxos)
  }
}

const createPrivateKeys = (n: number) => {
  return _.chain(n)
    .range()
    .map(_ => new bitcore.PrivateKey())
    .value()
}

// In satoshis
const totalAmount = (utxos: bitcore.UnspentOutput[]) : number => {
  return _.chain(utxos)
    .map(utxo => utxo.satoshis)
    .sum()
    .value()
}

export const redeem = async (options: {transactionId: string, prizeAddress: bitcore.Address, amount: number, publicKeys: bitcore.PublicKey[], tokens: bitcore.PrivateKey[], address: bitcore.Address }) => {
  const prizeAmount = options.amount - FEE

  const utxo : bitcore.UnspentOutput = {
    txId : options.transactionId,
    outputIndex : 0,
    address : options.prizeAddress.toString(),
    script : new bitcore.Script(options.prizeAddress).toHex(),
    satoshis : options.amount,
  }

  const transaction = new bitcore.Transaction()
    .from(utxo, options.publicKeys, options.tokens.length)
    .fee(FEE)
    .to(options.address, prizeAmount)
    .sign(options.tokens)

  await insightPromise.broadcastAsync(transaction.serialize())
  console.log("Redeemed treasure")
}


export const createTreasureHunt = (utxos: bitcore.UnspentOutput[], privateKey: bitcore.PrivateKey, options: { tokens: { total: number, required: number }}) : TreasureHunt => {
  const tokens = createPrivateKeys(options.tokens.total)
  const tokenPublicKeys = tokens.map(token => token.toPublicKey())

  const prizeAddress = new bitcore.Address(tokenPublicKeys, options.tokens.required)

  const prizeAmount = totalAmount(utxos) - FEE

  const transaction = new bitcore.Transaction()
    .from(utxos)
    .fee(FEE)
    .to(prizeAddress, prizeAmount)
    .sign(privateKey)

  const treasureHunt : TreasureHunt = {
    tokens: tokens,
    transacation: transaction,
    prizeAmount: prizeAmount,
    prizeAddress: prizeAddress,
  }

  return treasureHunt
}

// Example script
async function run() {
  // Create funding address
  const fundingPrivateKey = new bitcore.PrivateKey()
  const fundingAddress = fundingPrivateKey.toAddress()

  console.log("Send bitcoin to this address")
  qrcode.generate(fundingAddress.toString())

  try {
    const utxos = await waitForTransaction(fundingAddress)
    console.log("Address funded", utxos)

    const treasureHunt = createTreasureHunt(utxos, fundingPrivateKey, { tokens: { total: 10, required: 2 }})

    console.log("Broadcasting transaction")
    await insightPromise.broadcastAsync(treasureHunt.transacation.serialize())
    console.log("Transaction broadcasted successfully")

    // Once somebody founds the requiredTokens
    const tokenPublicKeys = treasureHunt.tokens.map(token => token.toPublicKey())
    await redeem({
      transactionId: treasureHunt.transacation.id, 
      prizeAddress: treasureHunt.prizeAddress, 
      amount: treasureHunt.prizeAmount, 
      publicKeys: tokenPublicKeys, 
      tokens: [treasureHunt.tokens[0], treasureHunt.tokens[1]],
      address: 'n49hbHgynpRK3eZdas1p52DCt8bHrY51oD'
    })

  } catch(err) {
    console.error(err.stack)
  }
}

// run()
