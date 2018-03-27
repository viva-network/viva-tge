require('chai')
 .use(require('chai-as-promised'))
 .should();

const testUtils = require('./test-utils');

const VIVACrowdsaleData = artifacts.require('VIVACrowdsaleData');

contract('VIVACrowdsaleData', async (accounts) => {

  const OWNER = accounts[0];
  const FUND_WALLET = accounts[1];

  it('should initialize properly', async () => {
    const time = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  });

});

