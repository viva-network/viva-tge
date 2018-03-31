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

});
