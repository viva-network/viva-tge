require('chai')
  .use(require('chai-as-promised'))
  .should();

const testUtils = require('./test-utils');

const VIVAToken = artifacts.require('VIVAToken');

contract('VIVAToken', async (accounts) => {

  // This is unit tested in zeppelin-solidity project (just test extended functions)

  const CAP = 100;

  it('should initialize properly', async () => {
    const now = testUtils.now();
    const instance = await VIVAToken.new(CAP);
    await instance.pause();
    let isPaused = await instance.paused();
    expect(isPaused).to.be.true;
  });

  it('should allow revoking mint if owner', async () => {
    const now = testUtils.now();
    const instance = await VIVAToken.new(CAP);
    await instance.pause();
    await instance.mint(accounts[1], 50);
    let balance = await instance.balanceOf(accounts[1]);
    assert(balance.toNumber() == 50);
    await instance.revokeMint(accounts[1], 50);
    balance = await instance.balanceOf(accounts[1]);
    assert(balance.toNumber() == 0);
    let totalSupply = await instance.totalSupply();
    assert(totalSupply.toNumber() == 0);
    await instance.mint(accounts[2], 100);
    balance = await instance.balanceOf(accounts[2]);
    assert(balance.toNumber() == 100);
    totalSupply = await instance.totalSupply();
    assert(totalSupply.toNumber() == 100);
  });

  it('should not allow revoking mint if not owner', async () => {
    const now = testUtils.now();
    const instance = await VIVAToken.new(CAP);
    await instance.pause();
    await instance.mint(accounts[1], 50);
    let balance = await instance.balanceOf(accounts[1]);
    assert(balance.toNumber() == 50);
    await instance.revokeMint(accounts[1], 50, {
      from: accounts[2]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should not allow revoking mint if not minting', async () => {
    const now = testUtils.now();
    const instance = await VIVAToken.new(CAP);
    await instance.pause();
    await instance.mint(accounts[1], 50);
    let balance = await instance.balanceOf(accounts[1]);
    assert(balance.toNumber() == 50);
    await instance.finishMinting();
    await instance.revokeMint(accounts[1], 50).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

});
