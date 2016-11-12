declare module "bitcore-lib" {
  // PrivateKey: PrivateKey
  // Transaction: any
  // Address: any
  // Unit: any
  // Script: any

  class Script {
    constructor(address: Address)
    toHex(): string
  }

  const Networks : {
    defaultNetwork: any
    testnet: any
  }

  class Address {
    constructor(publicKeys: PublicKey[], treshold: number)
    toString(): string
  }

  class PublicKey {
  }

  class PrivateKey {
    toAddress(): Address
    toPublicKey(): PublicKey
    toWIF(): string
    static fromWIF(wif: string): PrivateKey
  }

  interface UnspentOutput {
    txId: string
    outputIndex: number
    satoshis: number
    address: Address
    script: string
  }

  class Transaction {
    id: string
    from(utxos: any, publicKeys?: PublicKey[], treshold?: number): Transaction
    to(address: Address, amount: number): Transaction
    change(address: Address): Transaction
    fee(fee: number): Transaction
    sign(privateKeys: PrivateKey | PrivateKey[]): Transaction
    serialize(): string
  }
}
