require('chai')
 .use(require('chai-as-promised'))
 .should();

const testUtils = require('./test-utils');

const FrozenUntil = artifacts.require('FrozenUntil');

contract('FrozenUntil', async (accounts) => {


  it('should initialize properly', async () => {
    const now = new Date().getTime();
    let instance = await FrozenUntil.new(now-(10*testUtils.DAY));
    let isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.false;
    isFrozen = await instance.isFrozen(now-(20*testUtils.DAY));
    expect(isFrozen).to.be.true;
  });

  it('should not allow function call with modifer', async () => {
    const now = new Date().getTime();
    let instance = await FrozenUntil.new(now+(10*testUtils.DAY));
    let isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.true;
    await instance.test().should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should allow changing frozen until if owner', async () => {
    const now = new Date().getTime();
    let instance = await FrozenUntil.new(now+(10*testUtils.DAY));
    let isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.true;
    await instance.freezeUntil(now-testUtils.DAY);
    isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.false;
  });

  it('should not allow changing frozen until if not owner', async () => {
    const now = new Date().getTime();
    let instance = await FrozenUntil.new(now+(10*testUtils.DAY));
    let isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.true;
    await instance.freezeUntil(now-testUtils.DAY, {from:accounts[1]}).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    isFrozen = await instance.isFrozen(now);
    expect(isFrozen).to.be.true;
  });

});
