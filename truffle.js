module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    ropsten: {
      host: '127.0.0.1',
      port: 8545,
      network_id: "3",
      // gas: 4700000,
      // gasPrice: 300000000000,
      from: '0x7cbf7371c98ba4d5b15b958d66c53c67b9b590ff'
    }
  }
};

// build/bin/geth attach http://127.0.0.1:8545
// build/bin/geth --light --rinkeby --rpc --rpcapi="db,eth,net,web3,personal,web3" --rpccorsdomain '*' --rpcaddr localhost --rpcport 8545
