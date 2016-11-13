"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _ = require('lodash');
const bluebird_1 = require('bluebird');
const bitcore = require('bitcore-lib');
const Insight = require('bitcore-explorers').Insight;
const qrcode = require('qrcode-terminal');
const insight = new Insight('testnet');
const FEE = 6000;
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;
const insightPromise = bluebird_1.promisifyAll(insight);
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.waitForTransaction = (address) => __awaiter(this, void 0, void 0, function* () {
    const utxos = yield insightPromise.getUnspentUtxosAsync(address);
    if (_.isEmpty(utxos)) {
        console.log("No funds... Still waiting...");
        yield delay(4000);
        return exports.waitForTransaction(address);
    }
    else {
        return Promise.resolve(utxos);
    }
});
const createPrivateKeys = (n) => {
    return _.chain(n)
        .range()
        .map(_ => new bitcore.PrivateKey())
        .value();
};
const totalAmount = (utxos) => {
    return _.chain(utxos)
        .map(utxo => utxo.satoshis)
        .sum()
        .value();
};
exports.redeem = (options) => __awaiter(this, void 0, void 0, function* () {
    const prizeAmount = options.amount - FEE;
    const utxo = {
        txId: options.transactionId,
        outputIndex: 0,
        address: options.prizeAddress.toString(),
        script: new bitcore.Script(options.prizeAddress).toHex(),
        satoshis: options.amount,
    };
    const transaction = new bitcore.Transaction()
        .from(utxo, options.publicKeys, options.tokens.length)
        .fee(FEE)
        .to(options.address, prizeAmount)
        .sign(options.tokens);
    yield insightPromise.broadcastAsync(transaction.serialize());
    console.log("Redeemed treasure");
});
exports.createTreasureHunt = (utxos, privateKey, options) => {
    const tokens = createPrivateKeys(options.tokens.total);
    const tokenPublicKeys = tokens.map(token => token.toPublicKey());
    const prizeAddress = new bitcore.Address(tokenPublicKeys, options.tokens.required);
    const prizeAmount = totalAmount(utxos) - FEE;
    const transaction = new bitcore.Transaction()
        .from(utxos)
        .fee(FEE)
        .to(prizeAddress, prizeAmount)
        .sign(privateKey);
    const treasureHunt = {
        tokens: tokens,
        transacation: transaction,
        prizeAmount: prizeAmount,
        prizeAddress: prizeAddress,
    };
    return treasureHunt;
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const fundingPrivateKey = new bitcore.PrivateKey();
        const fundingAddress = fundingPrivateKey.toAddress();
        console.log("Send bitcoin to this address");
        qrcode.generate(fundingAddress.toString());
        try {
            const utxos = yield exports.waitForTransaction(fundingAddress);
            console.log("Address funded", utxos);
            const treasureHunt = exports.createTreasureHunt(utxos, fundingPrivateKey, { tokens: { total: 10, required: 2 } });
            console.log("Broadcasting transaction");
            yield insightPromise.broadcastAsync(treasureHunt.transacation.serialize());
            console.log("Transaction broadcasted successfully");
            const tokenPublicKeys = treasureHunt.tokens.map(token => token.toPublicKey());
            yield exports.redeem({
                transactionId: treasureHunt.transacation.id,
                prizeAddress: treasureHunt.prizeAddress,
                amount: treasureHunt.prizeAmount,
                publicKeys: tokenPublicKeys,
                tokens: [treasureHunt.tokens[0], treasureHunt.tokens[1]],
                address: 'n49hbHgynpRK3eZdas1p52DCt8bHrY51oD'
            });
        }
        catch (err) {
            console.error(err.stack);
        }
    });
}
//# sourceMappingURL=index.js.map