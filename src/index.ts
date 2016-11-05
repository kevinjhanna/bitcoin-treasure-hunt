import * as _ from 'lodash'
import { promisifyAll } from 'bluebird'

declare var require: Function
const bitcore = require('bitcore-lib')
const Insight = require('bitcore-explorers').Insight
const qrcode = require('qrcode-terminal')

// Use testnet
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet
const insight = new Insight('testnet')

const insightPromise = promisifyAll(insight) as {
  getUnspentUtxosAsync: (foo:any) => any
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

async function run() {
  // Create funding address
  const privateKey = new bitcore.PrivateKey();
  const address = privateKey.toAddress();

  console.log("Send bitcoin to this address")
  console.log(address.toString())
  qrcode.generate(address.toString())

  try {
    const utxos = await waitForTransaction(address)
    console.log("Finally utxos", utxos)
  } catch(err) {
    console.error(err)
  }
}

run()
