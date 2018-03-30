const HDWalletProvider = require('truffle-hdwallet-provider');

const secret = require('./secret');

/* Expects file ./secret.js:

module.exports = {
  mnemonic: '',
  infuraToken: ''
};

*/

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(secret.mnemonic, `https://ropsten.infura.io/${secret.infuraToken}`)
      },
      network_id: 3
    }
  }
};
