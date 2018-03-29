require('chai')
  .use(require('chai-as-promised'))
  .should();

const BigNumber = require('bignumber.js');

const testUtils = require('./test-utils');
const factory = require('./factory');
const ROUNDS = require('../rounds');

const VIVACrowdsale = artifacts.require('VIVACrowdsale');
const VIVACrowdsaleData = artifacts.require('VIVACrowdsaleData');
const VIVAToken = artifacts.require('VIVAToken');
const VIVACrowdsaleRound = artifacts.require('VIVACrowdsaleRound');
const VIVARefundVault = artifacts.require('VIVARefundVault');

contract('VIVACrowdsale', async (accounts) => {

  const GAS_PRICE = new BigNumber(100000000000);
  const OWNER = accounts[0];
  const FUND_WALLET_1 = accounts[1];
  const FUND_WALLET_2 = accounts[6];
  const PURCHASER_1 = accounts[2];
  const PURCHASER_2 = accounts[3];
  const SOME_ACCOUNT = accounts[4];
  const SOME_OTHER_ACCOUNT = accounts[7];
  const ADMINS = [OWNER];
  const NOT_ADMIN = accounts[5];

  async function testHelper(test, rounds, admins, startShift) {
    const data = await factory.crowdsaleDataInstance(
      FUND_WALLET_1,
      rounds || ROUNDS,
      admins || ADMINS,
      (startShift == null ? testUtils.DAY : startShift),
      true
    );
    const instance = await factory.crowdsaleInstance(data, admins || ADMINS, true);
    await test(instance);
  }

  it('should initialize properly', () => {
    return testHelper(async (instance) => {
      let owner = await instance.owner();
      expect(owner).to.equal(OWNER);
      let isAdmin = await instance.isAdmin(ADMINS[0]);
      expect(isAdmin).to.be.true;
    });
  });

  it('should have admin permission on data instance', () => {
    return testHelper(async (instance) => {
      let data = await instance.data();
      let isAdmin = await VIVACrowdsaleData.at(data).isAdmin(instance.address);
      expect(isAdmin).to.be.true;
    });
  });

  it('should accept private contributions from admin', () => {
    return testHelper(async (instance) => {
      await instance.privateContribution(SOME_ACCOUNT, 100, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.privateContribution(SOME_ACCOUNT, 100);
      let data = await instance.data();
      let token = await VIVACrowdsaleData.at(data).token();
      let balance = await VIVAToken.at(token).balanceOf(SOME_ACCOUNT);
      expect(balance.toNumber()).to.equal(100);
      let privateContributionTokens = await VIVACrowdsaleData.at(data).privateContributionTokens();
      expect(privateContributionTokens.toNumber()).to.equal(100);
    });
  });

  it('should not accept private contributions if cap exceeded', () => {
    return testHelper(async (instance) => {
      let tokensPrivateInvesting = await instance.tokensPrivateInvesting();
      let tokensMarketing = await instance.tokensMarketing();
      let totalCap = new BigNumber(tokensPrivateInvesting.toString()).plus(new BigNumber(tokensMarketing.toString()));
      await instance.privateContribution(SOME_ACCOUNT, totalCap.plus(1).toString()).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.privateContribution(SOME_ACCOUNT, totalCap.minus(2).toString());
      await instance.privateContribution(SOME_ACCOUNT, 1);
      await instance.privateContribution(SOME_ACCOUNT, 2).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.privateContribution(SOME_ACCOUNT, 1);
      await instance.privateContribution(SOME_ACCOUNT, 10).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should not accept private contribution if finalized', () => {
    return testHelper(async (instance) => {
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).finalize(SOME_ACCOUNT, false);
      await instance.privateContribution(SOME_OTHER_ACCOUNT, 1).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should get correct rounds with no ETH caps met', () => {
    return testHelper(async (instance) => {
      let now = testUtils.now();
      let startTime = now + testUtils.DAY;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      let round = await instance.getCurrentRound(now, 0);
      expect(round).to.equal(testUtils._0x0);
      // R1
      round = await instance.getCurrentRound(startTime, 0);
      let expectedRound = await VIVACrowdsaleData.at(data).rounds(0);
      expect(expectedRound).to.equal(round);
      round = await instance.getCurrentRound(startTime + (5 * testUtils.DAY), 0);
      expect(expectedRound).to.equal(round);
      // R2
      round = await instance.getCurrentRound(startTime + (10 * testUtils.DAY), 0);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(1);
      expect(expectedRound).to.equal(round);
      // R3
      round = await instance.getCurrentRound(startTime + (20 * testUtils.DAY), 0);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(2);
      expect(expectedRound).to.equal(round);
      round = await instance.getCurrentRound((startTime + (30 * testUtils.DAY)) - 1, 0);
      expect(expectedRound).to.equal(round);
      // R4
      round = await instance.getCurrentRound(startTime + (30 * testUtils.DAY), 0);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(3);
      expect(expectedRound).to.equal(round);
      // R5
      round = await instance.getCurrentRound(startTime + (50 * testUtils.DAY), 0);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(4);
      expect(expectedRound).to.equal(round);
      // R6
      round = await instance.getCurrentRound(startTime + (70 * testUtils.DAY), 0);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(5);
      expect(expectedRound).to.equal(round);
      round = await instance.getCurrentRound(startTime + (90 * testUtils.DAY) - 1, 0);
      expect(expectedRound).to.equal(round);
      // Done
      round = await instance.getCurrentRound(startTime + (90 * testUtils.DAY), 0);
      expect(round).to.equal(testUtils._0x0);
    });
  });

  it('should get correct rounds with ETH caps met', () => {
    return testHelper(async (instance) => {
      let now = testUtils.now();
      let startTime = now + testUtils.DAY;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      // R1
      let round = await instance.getCurrentRound(startTime, 0);
      let expectedRound = await VIVACrowdsaleData.at(data).rounds(0);
      expect(expectedRound).to.equal(round);
      let capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      round = await instance.getCurrentRound(startTime, new BigNumber(capAtWei.toString()).minus(1).toString());
      expect(expectedRound).to.equal(round);
      // R2
      round = await instance.getCurrentRound(startTime, capAtWei);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(1);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      // R3
      round = await instance.getCurrentRound(startTime, capAtWei);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(2);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      // R4
      round = await instance.getCurrentRound(startTime, capAtWei);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(3);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      // R5
      round = await instance.getCurrentRound(startTime, capAtWei);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(4);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      // R6
      round = await instance.getCurrentRound(startTime, capAtWei);
      expectedRound = await VIVACrowdsaleData.at(data).rounds(5);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(round).capAtWei();
      round = await instance.getCurrentRound(startTime, new BigNumber(capAtWei.toString()).minus(1).toString());
      expect(expectedRound).to.equal(round);
      // Done
      round = await instance.getCurrentRound(startTime, capAtWei);
      expect(round).to.equal(testUtils._0x0);
      round = await instance.getCurrentRound(startTime, new BigNumber(capAtWei.toString()).plus(1).toString());
      expect(round).to.equal(testUtils._0x0);
    });
  });

  it('should get correct rounds considering both ETH and duration caps', () => {
    return testHelper(async (instance) => {
      let data = await instance.data();
      let startTime = await VIVACrowdsaleData.at(data).startTime();
      let valuationDate = startTime.toNumber() + (5 * testUtils.DAY);

      let expectedRoundByTime = await VIVACrowdsaleData.at(data).rounds(0);
      let capAtWei = await VIVACrowdsaleRound.at(expectedRoundByTime).capAtWei();
      let expectedRound = await VIVACrowdsaleData.at(data).rounds(1); // Pushed by wei cap
      let round = await instance.getCurrentRound(valuationDate, capAtWei);
      expect(expectedRound).to.equal(round);
      capAtWei = await VIVACrowdsaleRound.at(expectedRound).capAtWei()
      expectedRound = await VIVACrowdsaleData.at(data).rounds(2);
      round = await instance.getCurrentRound(valuationDate, capAtWei);
      expect(expectedRound).to.equal(round);
    });
  });

  it('should not get token amount if no round in effect', () => {
    return testHelper(async (instance) => {
      let now = testUtils.now();
      let data = await instance.data();
      let round = await instance.getCurrentRound(now - testUtils.DAY, 0);
      expect(round).to.equal(testUtils._0x0);
      const value = web3.toWei(1, 'ether');
      await instance.getTokenAmount(round, value).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should get correct token amount for all rounds', () => {
    return testHelper(async (instance) => {
      const baseRate = 28000220000000;
      const tests = [{
          round: 0,
          cases: [{
            wei: 0,
            expect: 0
          }]
        },
        {
          round: 1,
          cases: [{
            wei: 0,
            expect: 0
          }]
        },
        {
          round: 2,
          cases: [{
            wei: 0,
            expect: 0
          }]
        },
        {
          round: 3,
          cases: [{
            wei: 0,
            expect: 0
          }]
        },
        {
          round: 4,
          cases: [{
            wei: 0,
            expect: 0
          }]
        },
        {
          round: 5,
          cases: [{
            wei: 0,
            expect: 0
          }]
        }
      ];
      let data = await instance.data();
      for (test of tests) {
        await testRound(test);
      }
      async function testRound(test) {
        let data = await instance.data();
        let round = await VIVACrowdsaleData.at(data).rounds(test.round);
        for (aCase of test.cases) {
          let tokens = await instance.getTokenAmount(round, aCase.wei);
          assert.equal(tokens.toString(), aCase.expect);
        }
      }
    });
  });

  it('should buy tokens', () => {
    return testHelper(async (instance) => {
      const value = web3.toWei(1, 'ether');
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      });
      let weiRaisedForSale = await VIVACrowdsaleData.at(data).weiRaisedForSale();
      expect(weiRaisedForSale.toString()).to.equal(value);
      let contributed = await VIVACrowdsaleData.at(data).getWeiContributed(PURCHASER_1);
      expect(contributed.toString()).to.equal(value);
    });
  });

  it('should buy tokens by default', () => {
    return testHelper(async (instance) => {
      const value = web3.toWei(1, 'ether');
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      await instance.sendTransaction({
        value,
        from: PURCHASER_1
      });
      let token = await VIVACrowdsaleData.at(data).token();
      let balance = await VIVAToken.at(token).balanceOf(PURCHASER_1);
      expect(balance.toNumber()).to.be.greaterThan(0);
    });
  });

  it('should not buy tokens if finalized', () => {
    return testHelper(async (instance) => {
      const value = web3.toWei(1, 'ether');
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      });
      await VIVACrowdsaleData.at(data).finalize(SOME_ACCOUNT, false);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should not buy tokens if no round in effect', () => {
    return testHelper(async (instance) => {
      const value = web3.toWei(1, 'ether');
      let now = testUtils.now();
      let startTime = now + (10 * testUtils.DAY);
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.setNow(365 * testUtils.DAY);
      await VIVACrowdsaleData.at(data).setNow(365 * testUtils.DAY);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should not buy tokens if not exceeding minimum contribution size', () => {
    return testHelper(async (instance) => {
      const value = web3.toWei(1, 'ether');
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      let minimum = await instance.minContributionWeiAmount();
      await instance.buyTokens({
        from: PURCHASER_1,
        value: '0'
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.buyTokens({
        from: PURCHASER_1,
        value: minimum.toNumber() - 1
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.buyTokens({
        from: PURCHASER_1,
        value: minimum.toNumber()
      });
    });
  });

  it('should not buy tokens if total sale token cap met', () => {
    return testHelper(async (instance) => {
      // TODO
    });
  });

  it('should not buy tokens if exceeding large investor size without approval', () => {
    return testHelper(async (instance) => {
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      await instance.buyTokens({
        from: PURCHASER_1,
        value: web3.toWei(8, 'ether')
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.buyTokens({
        from: PURCHASER_1,
        value: web3.toWei(7, 'ether')
      });
      await instance.buyTokens({
        from: PURCHASER_1,
        value: web3.toWei(1, 'ether')
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should buy tokens if exceeding large investor size with approval', () => {
    return testHelper(async (instance) => {
      let now = testUtils.now();
      let startTime = now;
      let data = await instance.data();
      await VIVACrowdsaleData.at(data).setStartTime(startTime);
      let value = web3.toWei(8, 'ether');
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await VIVACrowdsaleData.at(data).setLargeInvestorApproval(PURCHASER_1, value);
      await instance.buyTokens({
        from: PURCHASER_1,
        value
      });
      await instance.buyTokens({
        from: PURCHASER_1,
        value: web3.toWei(1, 'ether')
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await VIVACrowdsaleData.at(data).setLargeInvestorApproval(PURCHASER_1, web3.toWei(9, 'ether'));
      await instance.buyTokens({
        from: PURCHASER_1,
        value: web3.toWei(1, 'ether')
      });
    });
  });

  it('should blacklist token holder', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should blacklist non-token holder', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if blacklisted', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should register token purchase if valid', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should receive ETH correctly depending on refund state', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should allow cancel at any time not finalized', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should refund what is not cancelled by default', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should allow closing refund vault before cancel', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should finalize if cancelled', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should allow finalize at any time', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should create vaults with correct balances and ownerships during finalization', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should allow vault closing before finalization', () => {
    return testHelper(async (instance) => {

    });
  });

});
