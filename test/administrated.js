require('chai')
  .use(require('chai-as-promised'))
  .should();

const Administrated = artifacts.require('Administrated');

const testUtils = require('./test-utils');

contract('Administrated', async (accounts) => {

  it('should not make owner admin by default', async () => {
    let instance = await Administrated.new();
    let isAdmin = await instance.isAdmin(accounts[0]);
    expect(isAdmin).to.be.false;
  });

  it('should set admin', async () => {
    let instance = await Administrated.new();
    await instance.setAdmin(accounts[0], true);
    let isAdmin = await instance.isAdmin(accounts[0]);
    expect(isAdmin).to.be.true;
  });

  it('should revoke admin', async () => {
    let instance = await Administrated.new();
    await instance.setAdmin(accounts[0], true);
    let isAdmin = await instance.isAdmin(accounts[0]);
    expect(isAdmin).to.be.true;
    await instance.setAdmin(accounts[0], false);
    isAdmin = await instance.isAdmin(accounts[0]);
    expect(isAdmin).to.be.false;
  });

  it('should not set admin if not owner', async () => {
    let instance = await Administrated.new();
    await instance.setAdmin(accounts[1], true, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should transfer ownership', async () => {
    let instance = await Administrated.new();
    await instance.setAdmin(accounts[1], true, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await instance.transferOwnership(accounts[1]);
    await instance.setAdmin(accounts[0], true, {
      from: accounts[0]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await instance.setAdmin(accounts[1], true, {
      from: accounts[1]
    });
    let isAdmin = await instance.isAdmin(accounts[1]);
    expect(isAdmin).to.be.true;
  });

  it('should set admin if not owner and admin', async () => {
    let instance = await Administrated.new();
    await instance.setAdmin(accounts[2], true, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await instance.setAdmin(accounts[1], true);
    await instance.setAdmin(accounts[2], true, {
      from: accounts[1]
    });
    let isAdmin = await instance.isAdmin(accounts[2]);
    expect(isAdmin).to.be.true;
  });

});
