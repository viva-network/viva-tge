require('chai')
 .use(require('chai-as-promised'))
 .should();

const VIVARefundVault = artifacts.require('VIVARefundVault');

const testUtils = require('./test-utils');

contract('VIVARefundVault', async (accounts) => {

  // This is unit tested in zeppelin-solidity project (just test extended functions)

  it('should set wallet', async () => {
    let instance = await VIVARefundVault.new(accounts[0]);
    let wallet = await instance.getWallet();
    expect(wallet).to.equal(accounts[0]);
    await instance.setWallet(accounts[1]);
    wallet = await instance.getWallet();
    expect(wallet).to.equal(accounts[1]);
  });

  it('should not set wallet if not owner', async () => {
    let instance = await VIVARefundVault.new(accounts[0]);
    let wallet = await instance.getWallet();
    expect(wallet).to.equal(accounts[0]);
    await instance.setWallet(accounts[1], { from: accounts[2] }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    wallet = await instance.getWallet();
    expect(wallet).to.equal(accounts[0]);
  });

});
