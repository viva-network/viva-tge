require('chai')
 .use(require('chai-as-promised'))
 .should();

const testUtils = require('./test-utils');

const VIVACrowdsaleRound = artifacts.require('VIVACrowdsaleRound');

contract('VIVACrowdsaleRound', async (accounts) => {

  const refundable = true;
  const capAtWei = web3.toWei(1, "ether");
  const capAtDuration = 10 * testUtils.DAY;

  it('should initialize properly', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    let _refundable = await instance.refundable();
    expect(_refundable).to.equal(refundable);
    let _capAtWei = await instance.capAtWei();
    assert(_capAtWei.toNumber() == capAtWei);
    let _capAtDuration = await instance.capAtDuration();
    assert(_capAtDuration.toNumber() == capAtDuration);
  });

  it('should set capAtDuration if owner', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    let _capAtDuration = await instance.capAtDuration();
    assert(_capAtDuration.toNumber() == capAtDuration);
    await instance.setCapAtDuration(capAtDuration*2);
    _capAtDuration = await instance.capAtDuration();
    assert(_capAtDuration.toNumber() == capAtDuration*2);
  });

  it('should not set capAtDuration if not owner', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    let _capAtDuration = await instance.capAtDuration();
    assert(_capAtDuration.toNumber() == capAtDuration);
    await instance.setCapAtDuration(capAtDuration*2, { from: accounts[1] }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    _capAtDuration = await instance.capAtDuration();
    assert(_capAtDuration.toNumber() == capAtDuration);
  });

  const baseRate = 10000;
  const bonusNoTier = { tier: 0, rate: 50000 };

  it('should return no bonus', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    let bonusRate = await instance.getBonusRate(baseRate, web3.toWei(1, "ether"));
    assert(bonusRate.toNumber() == baseRate);
  });

  it('should add bonus if owner', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    await instance.addBonus(bonusNoTier.tier, bonusNoTier.rate);
    let bonusRate = await instance.getBonusRate(baseRate, web3.toWei(1, "ether"));
    assert(bonusRate.toNumber() == bonusNoTier.rate);
  });

  it('should not add bonus if not owner', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    await instance.addBonus(bonusNoTier.tier, bonusNoTier.rate, { from: accounts[1] }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
  });

  const bonusTier1 = { tier: web3.toWei(1, "ether"), rate: 50000 };
  const bonusTier2 = { tier: web3.toWei(2, "ether"), rate: 60000 };

  it('should calculate tiered bonus', async () => {
    let instance = await VIVACrowdsaleRound.new(refundable, capAtWei, capAtDuration);
    await instance.addBonus(bonusTier1.tier, bonusTier1.rate);
    await instance.addBonus(bonusTier2.tier, bonusTier2.rate);
    let bonusRate = await instance.getBonusRate(baseRate, web3.toWei(0.5, "ether"));
    assert(bonusRate.toNumber() == baseRate);
    bonusRate = await instance.getBonusRate(baseRate, web3.toWei(1, "ether"));
    assert(bonusRate.toNumber() == bonusTier1.rate);
    bonusRate = await instance.getBonusRate(baseRate, web3.toWei(1.9, "ether"));
    assert(bonusRate.toNumber() == bonusTier1.rate);
    bonusRate = await instance.getBonusRate(baseRate, web3.toWei(2, "ether"));
    assert(bonusRate.toNumber() == bonusTier2.rate);
    bonusRate = await instance.getBonusRate(baseRate, web3.toWei(4, "ether"));
    assert(bonusRate.toNumber() == bonusTier2.rate);
  });

});
