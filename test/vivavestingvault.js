require('chai')
  .use(require('chai-as-promised'))
  .should();

const VIVAToken = artifacts.require('VIVAToken');
const VIVAVestingVault = artifacts.require('VIVAVestingVault');

const testUtils = require('./test-utils');

contract('VIVAVestingVault', async (accounts) => {

  const TOKEN_CAP = 100;

  it('should initialize properly', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    let balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance == mintTokens);
  });

  it('should register beneficiaries if admin', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.register(accounts[2], mintTokens / 2, {
      from: accounts[1]
    });
  });

  it('should not register beneficiaries if not admin', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.register(accounts[2], mintTokens / 2, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  it('should calculate correct releasable amounts', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.register(accounts[2], mintTokens / 2, {
      from: accounts[1]
    });
    let releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == 0);
    await vaultInstance.setNow(d1);
    releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == mintTokens / 4);
    await vaultInstance.setNow(d2);
    releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == mintTokens / 4);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == mintTokens / 2);
  });

  it('should not allow release of tokens exceeding releasable', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.register(accounts[2], mintTokens / 2, {
      from: accounts[1]
    });
    let releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == 0);
    await vaultInstance.release(accounts[2], mintTokens / 2, {
      from: accounts[2]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.setNow(d1);
    releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == mintTokens / 4);
    await vaultInstance.release(accounts[2], mintTokens, {
      from: accounts[2]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.release(accounts[2], releasable, {
      from: accounts[2]
    });
    let balance = await tokenInstance.balanceOf(accounts[2]);
    assert(balance.toNumber() == releasable);
    balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance.toNumber() == mintTokens - releasable);
    await vaultInstance.setNow(d2);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[2]
    });
    assert(releasable == 0);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == mintTokens / 4);
    await vaultInstance.release(accounts[2], releasable, {
      from: accounts[2]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.release(accounts[2], releasable, {
      from: accounts[1]
    });
    balance = await tokenInstance.balanceOf(accounts[2]);
    assert(balance.toNumber() == mintTokens / 2);
    balance = await tokenInstance.balanceOf(vaultInstance.address);
    assert(balance.toNumber() == mintTokens / 2);
  });

  it('should calculate correct releasable tokens after release', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.register(accounts[2], 50, {
      from: accounts[1]
    });
    let releasable = await vaultInstance.releasableAmount(accounts[2]);
    await vaultInstance.setNow(d1);
    releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == 25);
    await vaultInstance.release(accounts[2], 20, {
      from: accounts[1]
    });
    releasable = await vaultInstance.releasableAmount(accounts[2]);
    assert(releasable == 5);
    await vaultInstance.release(accounts[2], 10).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.setNow(d2);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[2]
    });
    assert(releasable == 5);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == 30);
    await vaultInstance.release(accounts[2], 30, {
      from: accounts[2]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.release(accounts[2], 5, {
      from: accounts[2]
    });
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[2]
    });
    assert(releasable == 0);
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == 25);
    await vaultInstance.release(accounts[2], 30, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.release(accounts[2], 25, {
      from: accounts[1]
    });
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == 0);
  });

  it('should not allow release of more tokens than minted', async () => {
    let tokenInstance = await VIVAToken.new(TOKEN_CAP, 0);
    const now = testUtils.now();
    const d1 = now + (10 * testUtils.DAY);
    const d2 = now + (20 * testUtils.DAY);
    let vaultInstance = await VIVAVestingVault.new(tokenInstance.address, d1, d2, true);
    const mintTokens = 100;
    await tokenInstance.mint(vaultInstance.address, mintTokens);
    await vaultInstance.setAdmin(accounts[1], true);
    await vaultInstance.register(accounts[2], 150, {
      from: accounts[1]
    });
    await vaultInstance.setNow(d2);
    let releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == 150);
    await vaultInstance.release(accounts[2], 150, {
      from: accounts[1]
    }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    await vaultInstance.release(accounts[2], 100, {
      from: accounts[1]
    });
    releasable = await vaultInstance.releasableAmount(accounts[2], {
      from: accounts[1]
    });
    assert(releasable == 50);
  });


});
