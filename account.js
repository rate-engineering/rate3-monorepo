const bip39 = require('bip39')
const forge = require('node-forge');
const fs = require('fs');
const stellarHDWallet = require('stellar-hd-wallet') 
const StellarSdk = require('stellar-sdk');
const ethereum_wallet = require('ethereumjs-wallet')
const ethUtil = require('ethereumjs-util');
const tx = require('ethereumjs-tx');
var Web3 = require('web3');
var web3 = new Web3("https://rinkeby.infura.io/v3/54add33f289d4856968099c7dff630a7");

/**
 * @class account
 * @description
 * This is a wrapper class over stellar and ethereum accounts.
 * For those fields/methods that are already there when the original
 * account is passed in, this class simply extracts them;
 * Otherwise, the fields/methods are created and saved in this class. 
 */
class account{
    /**
     * constructor
     * @memberof account
     * @param {string} network 
     */
    constructor(network) {
        if (network == 'stellar') {
            this.network = 'stellar'
        } else if (network == 'ethereum') {
            this.network = 'ethereum'
        } else {
            console.log('The name of the network must be stellar or ethereum.')
        }
    }

    /**
     * Set the account field of this account to be the argument;
     * For Stellar, upload it to the testnet and update the balance;
     * For Ethereum, update its balance read on the Rinbeky testnet.
     * @param {object} account - A stellar or ethereum account
     */
    setAccount (account) {
        var request = require('request');
        if (this.network == null) {
            console.log('The network of this account must be set first.')
            return null
        } else if (this.network == 'stellar') {
            //check if the account is already on testnet
            this.account = account
            this.balance = '-1'
            var self = this
            //).then((error, response, body) => {})
            request('https://horizon-testnet.stellar.org' + '/accounts/' + this.getAddress(), function (error, response, body) {
                if (response.statusCode == 200) {
                    // the account is alreay on the testnet
                    // retrieve the balance value and set it here, in string
                    self.balance = JSON.parse(body).balances[0].balance
                } else {
                    //the account is not on the testnet
                    // load it to test net and then retrieve the balance
                    request.get({
                        url: 'https://friendbot.stellar.org',
                        qs: { addr: account.publicKey() },
                        json: true
                        }, function(error, response, body) {
                            if (error || response.statusCode !== 200) {
                                console.error('ERROR!', error || body);
                            }
                            else {
                                console.log('SUCCESS! You have a new account :)\n', body);
                                // retrieve the balance value and set it here
                                request('https://horizon-testnet.stellar.org' + '/accounts/' + account.publicKey(), function (error, response, body) {
                                    if (response.statusCode == 200) {
                                        self.balance = JSON.parse(body).balances[0].balance
                                    } else {
                                        console.log('error:', error)
                                    }
                                });
                            }
                    
                    });
                }
            });
        } else if (this.network == 'ethereum') {
            this.account = account
            this.balance = '-1'
            var self = this
            web3.eth.getBalance(account.address, function(err, val) {
                if (err != null) {
                    console.log('Cannot get the eth balance')
                } else {
                    self.balance = val
                }
            });
        } else {
            this.account = null
            console.log('The account network is not correctly set.')
        }
    }

    /**
     * Sign the data using the private key of the current account
     * @param {string} data - the data (string) to be signed
     */
    sign(data) {
        if(this.network == 'stellar') {
            //sign
            if (this.account.canSign()) {
                
                return this.account.sign(data)//.toString()
            } else {
                console.log('The Stellar account does not contain a private key and cannot sign')
                return null
            }
        } else if (this.network == 'ethereum') {
            return web3.eth.accounts.sign(data, this.getPrivateKey())
        }
    }

    /**
     * Send an amount from the current account to another account
     * @param {string} to - the address that recerives XLM/ETH
     * @param {string} amount - the amount of XLM/ETH sent; e.g. 100XLM; 0.01 eth
     */
    send(to, amount) {
        if(this.network == 'stellar') {
            StellarSdk.Network.useTestNetwork();
            var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
            // Transaction will hold a built transaction we can resubmit if the result is unknown.
            var transaction;
            var self = this
            // First, check to make sure that the destination account exists.
            // You could skip this, but if the account does not exist, you will be charged
            // the transaction fee when the transaction fails.
            server.loadAccount(to)
              // If the account is not found, surface a nicer error message for logging.
              .catch(StellarSdk.NotFoundError, function (error) {
                throw new Error('The destination account does not exist!');
              })
              // If there was no error, load up-to-date information on your account.
              .then(function() {
                return server.loadAccount(self.getAddress());
              })
              .then(function(sourceAccount) {
                // Start building the transaction.
                transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                  .addOperation(StellarSdk.Operation.payment({
                    destination: to,
                    // Because Stellar allows transaction in many currencies, you must
                    // specify the asset type. The special "native" asset represents Lumens.
                    asset: StellarSdk.Asset.native(),
                    amount: amount
                  }))
                  .build();
                // Sign the transaction to prove you are actually the person sending it.
                transaction.sign(self.account)// use the keypair to sign
                // And finally, send it off to Stellar!
                return server.submitTransaction(transaction);
              })
              .then(function(result) {
                console.log('Success! Results:', result);
              })
              .catch(function(error) {
                console.error('Something went wrong!', error);
                // If the result is unknown (no response body, timeout etc.) we simply resubmit
                // already built transaction:
                // server.submitTransaction(transaction);
              });
        } else if (this.network == 'ethereum') {
                // infura accepts only raw transactions, because it does not handle private keys
            const rawTransaction = {
            "from": this.getAddress(),//'0x1d14a9ed46653b2b833f4dac3b6a786c76faedc2', from address
            "to": to,//'0x2e2a32690B2D09089F62BF3C262edA1aC1118f8F', to address
            "value": web3.utils.toHex(web3.utils.toWei(amount, "ether")),// e.g. '0.001'
            "gas": 30000,
            "chainId": 4 // https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
            
            };
            
            this.account.signTransaction(rawTransaction)
            .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
            .then(receipt => console.log("Transaction receipt: ", receipt))
            .catch(err => console.error(err));
                }
    }

    /**
     * This methods sets the history field of this account.
     * All the fields in the response are retained, in JSON format
     */
    receive() {
        var request = require('request');
        var self = this
        self.history = null
        if(this.network == 'stellar') {
            var accountId = this.getAddress()
            request('https://horizon-testnet.stellar.org/accounts/GAQNFJEZWLX4MX6YFKQEPAXUH6SJRTTD4EAWGYOA34WNHNPW5EJXU4VV/payments', 
            function(error, response, body) {
                self.history =  JSON.parse(body)._embedded.records; // Print the HTML for the Google homepage.
                console.log('body:', self.history)
            });

            // Create an API call to query payments involving the account.
            // var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
            // var payments = server.payments().forAccount(accountId);

            // server.transactions()
            // .forAccount(accountId)
            // .call()
            // .then(function (page) {
            //     console.log('Page 1: ');
            //     console.log(page.records);
            //     self.history = page.records
            // })
            // .catch(function (err) {
            //     console.log(err);
            // });
        } else if (this.network == 'ethereum') {
            request('http://api-rinkeby.etherscan.io/api?module=account&action=txlist&address='+ self.getAddress() +'&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken',
                function(error, response, body) {
                    self.history = JSON.parse(body).result
                });
        }
        
    }

    /**
     * Construct the transaction from the uri (stellar), and sign it with the current account
     * Return the signed transaction
     * For ethereum, take the transaction hash, and sign it; 
     * Use the getter to get the signed transaction 
     * @param {string} uri - the input uri (stellar); tx hash (ethereum)
     */
    delegatedSigning(uri) {
        var self = this
        if(this.network == 'stellar') {
            let txEnvelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(uri.slice(19), 'base64')
            //web+stellar:tx?xdr=... the xdr starts from position 19 of the string
            let tx1 = new StellarSdk.Transaction(txEnvelope);
            StellarSdk.Network.useTestNetwork();
            tx1.sign(this.account)
            return tx1
        } else if (this.network == 'ethereum') {
            web3.eth.getTransaction('0x793aa73737a2545cd925f5c0e64529e0f422192e6bbdd53b964989943e6dedda')
            .then(function (tx) {
                return web3.eth.accounts.signTransaction(tx, self.getPrivateKey())
            }).then(function (signedTx) {self.signedTransaction = signedTx;
                console.log(self.signedTransaction)
                return self.signTransaction});
        }
    }

    /**
     * For ethereum delegated signing to get the signed transaction
     */
    getSignedTransaction() {
        return this.signedTransaction
    }

    /**
     * Return the network where the account is.
     */
    getNetwork() {
        return this.network
    }

    /**
     * Get the balance associated to this account.
     * Currently only values for XLM and ETH are saved.
     * i.e. there is no other types of currency.
     */
    getBalance() {
        return this.balance
    }

    /**
     * Get transaction history in and out from this account.
     * Currently it is the raw json response, and 
     * different between eth and stellar.
     */
    getHistory() {
        return this.history
    }

    /**
     * Get the account that is passed into this wrapper class.
     */
    getOriginalAccount() {
        return this.account
    }

    /**
     * The address of a stellar account is the public key of the key pair;
     * The address of an ethereum account is a part of the hash of the public key
     */
    getAddress() {
        switch(this.network) {
            case 'stellar':
                return this.account.publicKey()
            case 'ethereum':
                return this.account.address
            default:
                return null //If the network is not set correctly
        }
    }

    /**
     * Return the private key (ethereum) / secret (stellar)
     */
    getPrivateKey() {
        switch(this.network) {
            case 'stellar':
                return this.account.secret()
            case 'ethereum':
                return this.account.privateKey
            default:
                return null //If the network is not set correctly
        }
    }

}

module.exports = account

// let wallet_manager_module = require('./wallet_manager')
// let seed_phrases = 'aspect body artist annual sketch know plug subway series noodle loyal word'
// const wallet_manager = new wallet_manager_module('stellar')
// wallet_manager.setSeed(seed_phrases)
// wallet_manager.setWallet()
// let toPrivateKey = 'SA6XR67FP7ZF4QBOYGPXUBSBQ6275E4HI7AOVSL56JETRBQG2COJCAGP'
// let toPublicKey = 'GAQNFJEZWLX4MX6YFKQEPAXUH6SJRTTD4EAWGYOA34WNHNPW5EJXU4VV'
// let fromAddress = null
// let fromPrivateKey = null
// let acc = wallet_manager.getAccount(3)
// let sampleXDR = 'web+stellar:tx?xdr=AAAAAKEXb+g8NGdB5fncWTVdm1VYU/+1EaZfac9+IUMSWlldAAAAZACpzYcAAAAKAAAAAAAAAAAAAAABAAAAAQAAAAChF2/oPDRnQeX53Fk1XZtVWFP/tRGmX2nPfiFDElpZXQAAAAEAAAAAINKkmbLvxl/YKqBHgvQ/pJjOY+EBY2HA3yzTtfbpE3oAAAAAAAAAAACYloAAAAAAAAAAAA=='
// console.log(acc.delegatedSigning(sampleXDR))

// acc.receive()
// acc.send(toPublicKey, '10')
// acc.send(toPublicKey, '20')
// acc.send(toPublicKey, '30')

// let wallet_manager_module = require('./wallet_manager')
// let seed_phrases = 'aspect body artist annual sketch know plug subway series noodle loyal word'
// const wallet_manager = new wallet_manager_module('ethereum')
// wallet_manager.setSeed(seed_phrases)
// wallet_manager.setWallet()
// let fromPrivateKey = '0x10848a86334b428a2f6bdaeaf6dccbe6b3d07ebcc538af29f83a9139ac6c40e8'
// let fromPublicKey = '0xfd3B37102b3882E08c8D38fF8BAc1b1b305dc103'
// let toPrivateKey = '0x0442eaba5727f864d62dab0858bd07e6c24484711b215285b108ee6048ba87ea'
// let toPublicKey = '0x7037eAcB1bb6Bf8eE8Cdd1A48f59D3b5BeC63BC2'
// let acc = wallet_manager.getAccount(4)//3 from 4 to
// console.log(acc.delegatedSigning('1'))
// console.log(acc.signedTransaction)
// console.log(acc.getAddress())
// // console.log(acc.getPrivateKey())
// //acc.send(toPublicKey, '0.01')
// acc.receive()

