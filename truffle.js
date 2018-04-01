const HDWalletProvider = require('truffle-hdwallet-provider');

const secret = require('./secret');

/* secret.js:
module.exports = {
  infura: '',
  mnemonic: '',
  from: ''
};
*/

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 9545,
      network_id: '*'
    },
    live: {
      network_id: '1',
      provider: function() {
        return new HDWalletProvider(secret.mnemonic, `https://mainnet.infura.io/${secret.infura}`)
      },
      gas: 7500000,
      gasPrice: 8000000000
      // from: secret.from
    },
    rinkeby: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '4',
      gas: 7500000,
      gasPrice: 15000000000,
      from: secret.from
    }
  }
};

// build/bin/geth attach http://127.0.0.1:8545
// build/bin/geth --fast --rinkeby --rpc --rpcapi="db,eth,net,web3,personal,web3" --rpccorsdomain '*' --rpcaddr localhost --rpcport 8545
