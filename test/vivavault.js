require('chai')
  .use(require('chai-as-promised'))
  .should();

const VIVAToken = artifacts.require('VIVAToken');
const VIVAVault = artifacts.require('VIVAVault');

const testUtils = require('./test-utils');

contract('VIVAVault', async (accounts) => {

  const TOKEN_CAP = 100;

  it('should initialize properly', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
    // await vaultInstance.setAdmin(accounts[1], true);
  });

  it('should allow admin to release tokens if not frozen', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    let releaseable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releaseable == mintTokens);
    await vaultInstance.release(accounts[2], mintTokens, {
      from: accounts[1]
    });
    balance = await tokenInstance.balanceOf(accounts[2]);
    assert(balance == mintTokens);
  });

  it('should not allow release tokens if not admin', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
    await vaultInstance.release(accounts[2], mintTokens, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should not allow owner to release tokens if not admin', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.release(accounts[1], mintTokens).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should not allow admin to release more tokens that available', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.release(accounts[2], mintTokens * 2, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
  });

  it('should not allow admin to release tokens if frozen', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now + (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.release(accounts[2], mintTokens, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should not allow admin to release tokens if all released', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.release(accounts[2], mintTokens / 2, {
      from: accounts[1]
    });
    await vaultInstance.release(accounts[2], mintTokens / 2, {
      from: accounts[1]
    });
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == 0);
    balance = await tokenInstance.balanceOf(accounts[2]);
    assert(balance == mintTokens);
    await vaultInstance.release(accounts[2], 1, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should not allow admin to release tokens negative amount', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    let vaultInstance = await VIVAVault.new(tokenInstance.address);
    const now = testUtils.now();
    await tokenInstance.freezeUntil(now - (10 * testUtils.DAY));
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.release(accounts[2], -1, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

});
