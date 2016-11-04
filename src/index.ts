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


async function waitForTransaction(address: any) {
  const utxos = await insightPromise.getUnspentUtxosAsync(address)

  if (_.isEmpty(utxos)) {
    console.log('No funds... Waiting...')
    return new Promise<void>(resolve => {
      setTimeout(waitForTransaction, 4000, address);
    })
  } else {
    console.log('found', utxos)
    return new Promise<any>(resolve => {
      return utxos
    })
  }
}

async function run() {
  // Create funding address
  const privateKey = new bitcore.PrivateKey();
  const address = privateKey.toAddress();

  console.log("Send bitcoin to this address")
  console.log(address.toString())
  qrcode.generate(address.toString())

  const utxos = await waitForTransaction(address)
  // this is not being called, why?
  console.log('Finally utxos', utxos)
}

run()


// / printDelayed is a 'Promise<void>'
// async function printDelayed(elements: string[]) {
//     for (const element of elements) {
//         await delay(200);
//         console.log(element);
//     }
// }

// async function delay(milliseconds: number) {
//     return new Promise<void>(resolve => {
//         setTimeout(resolve, milliseconds);
//     });
// }

// printDelayed(["Hello", "beautiful", "asynchronous", "world"]).then(() => {
//     console.log();
//     console.log("Printed every element!");
// });



