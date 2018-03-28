require('chai')
  .use(require('chai-as-promised'))
  .should();


const BigNumber = require('bignumber.js');

const testUtils = require('./test-utils');
const factory = require('./factory');
const ROUNDS = require('../rounds');

const VIVACrowdsaleData = artifacts.require('VIVACrowdsaleData');
const VIVAToken = artifacts.require('VIVAToken');
const VIVACrowdsaleRound = artifacts.require('VIVACrowdsaleRound');
const VIVARefundVault = artifacts.require('VIVARefundVault');

contract('VIVACrowdsaleData', async (accounts) => {

  const GAS_PRICE = new BigNumber(100000000000);
  const OWNER = accounts[0];
  const FUND_WALLET = accounts[1];
  const PURCHASER_1 = accounts[2];
  const PURCHASER_2 = accounts[3];
  const SOME_ACCOUNT = accounts[4];
  const ADMINS = [OWNER, PURCHASER_1, PURCHASER_2];
  const NOT_ADMIN = accounts[5];

  /*
  FIXME A workaround here, we have made purchasers admins for testing
  because registerPurchase is restricted to direct call by admin, but
  also expects accompanying ETH payment. It is intended to be called 
  by the (administrative) main VIVACrowdsale contract forwarding origin's
  ETH payment. But I cannot figure out how to simulate this in Truffle
  (i.e. send ETH payment from wallet X while calling from wallet Y).
  */

  async function testHelper(test, rounds, admins, startShift) {
    const instance = await factory.crowdsaleDataInstance(
      FUND_WALLET,
      rounds || ROUNDS,
      admins || ADMINS,
      (startShift == null ? testUtils.DAY : startShift),
      true
    );
    await test(instance);
  }

  it('should initialize properly', () => {
    return testHelper(async (instance) => {
      let owner = await instance.owner();
      expect(owner).to.equal(OWNER);
      let isAdmin = await instance.isAdmin(ADMINS[0]);
      expect(isAdmin).to.be.true;
      let isFinalized = await instance.isFinalized();
      expect(isFinalized).to.be.false;
      let token = await instance.token();
      owner = await VIVAToken.at(token).owner();
      expect(owner).to.equal(instance.address);
      let wallet = await instance.wallet();
      expect(wallet).to.equal(FUND_WALLET);
    });
  });

  it('should initially freeze token indefinitely', () => {
    return testHelper(async (instance) => {
      let token = await instance.token();
      let frozen = await VIVAToken.at(token).isFrozen(testUtils.now());
      expect(frozen).to.be.true;
      frozen = await VIVAToken.at(token).isFrozen(testUtils.now() + (1000 * 365 * testUtils.DAY));
      expect(frozen).to.be.true;
    });
  });

  it('should return correct number of rounds', () => {
    return testHelper(async (instance) => {
      let numRounds = await instance.getNumRounds();
      expect(numRounds.toNumber()).to.equal(ROUNDS.length);
    });
  });

  it('should allow changing start time', () => {
    return testHelper(async (instance) => {
      let firstStartTime = await instance.startTime();
      expect(firstStartTime.toNumber()).to.be.greaterThan(0);
      await instance.setStartTime(firstStartTime.toNumber() + testUtils.DAY);
      let secondStartTime = await instance.startTime();
      expect(secondStartTime.toNumber() - firstStartTime.toNumber()).to.equal(testUtils.DAY);
      await instance.setStartTime(secondStartTime + testUtils.DAY, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should mint tokens', () => {
    return testHelper(async (instance) => {
      await instance.mintTokens(SOME_ACCOUNT, 50);
      let token = await instance.token();
      let balance = await VIVAToken.at(token).balanceOf(SOME_ACCOUNT);
      expect(balance.toNumber()).to.equal(50);
      await instance.mintTokens(SOME_ACCOUNT, 50, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should register private contributions', () => {
    return testHelper(async (instance) => {
      await instance.registerPrivateContribution(PURCHASER_1, 50);
      let privateContributionTokens = await instance.privateContributionTokens();
      expect(privateContributionTokens.toNumber()).to.equal(50);
      await instance.registerPrivateContribution(PURCHASER_2, 50);
      privateContributionTokens = await instance.privateContributionTokens();
      expect(privateContributionTokens.toNumber()).to.equal(100);
      let token = await instance.token();
      let totalSupply = await VIVAToken.at(token).totalSupply();
      expect(totalSupply.toNumber()).to.equal(0);
      await instance.registerPrivateContribution(PURCHASER_1, 50, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should register valid refundable purchase', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(3);
      let refundable = await VIVACrowdsaleRound.at(round).refundable();
      expect(refundable).to.be.true;
      const value = web3.toWei(1, 'ether');
      // First purchase
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      let contributed = await instance.getWeiContributed(PURCHASER_1);
      expect(contributed.toString()).to.equal(value);
      let weiRaised = await instance.weiRaisedForSale();
      expect(weiRaised.toString()).to.equal(value);
      let mintedForSaleTokens = await instance.mintedForSaleTokens();
      expect(mintedForSaleTokens.toNumber()).to.equal(50);
      // Another purchase from new address
      await instance.registerPurchase(round, PURCHASER_2, 50, {
        value,
        from: PURCHASER_2
      });
      contributed = await instance.getWeiContributed(PURCHASER_2);
      expect(contributed.toString()).to.equal(value);
      contributed = await instance.getWeiContributed(PURCHASER_1);
      expect(contributed.toString()).to.equal(value);
      weiRaised = await instance.weiRaisedForSale();
      expect(weiRaised.toString()).to.equal(web3.toWei(2, 'ether'));
      mintedForSaleTokens = await instance.mintedForSaleTokens();
      expect(mintedForSaleTokens.toNumber()).to.equal(100);
      // Same address as first purchase
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value
      });
      contributed = await instance.getWeiContributed(PURCHASER_1);
      expect(contributed.toString()).to.equal(web3.toWei(2, 'ether'));
      weiRaised = await instance.weiRaisedForSale();
      expect(weiRaised.toString()).to.equal(web3.toWei(3, 'ether'));
      mintedForSaleTokens = await instance.mintedForSaleTokens();
      expect(mintedForSaleTokens.toNumber()).to.equal(150);
      // Check refund vault
      const vault = await instance.refundVault();
      let balance = web3.eth.getBalance(vault);
      expect(balance.toString()).to.equal(web3.toWei(3, 'ether'));
      // Ensure onlyAdmin
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should register valid unrefundable purchase', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(0);
      let refundable = await VIVACrowdsaleRound.at(round).refundable();
      expect(refundable).to.be.false;
      let initialWalletBalance = web3.eth.getBalance(FUND_WALLET);
      const value = web3.toWei(1, 'ether');
      // First purchase
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      // Check refund vault
      const vault = await instance.refundVault();
      let balance = web3.eth.getBalance(vault);
      expect(balance.toString()).to.equal(web3.toWei(0, 'ether'));
      // Check wallet balance
      balance = web3.eth.getBalance(FUND_WALLET);
      assert.equal(balance.toNumber() - initialWalletBalance.toNumber(), value);
    });
  });

  it('should not register invalid purchase', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(0);
      const value = web3.toWei(1, 'ether');
      await instance.registerPurchase('0x0', PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.registerPurchase(round, '0x0', 50, {
        value
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should close refund vault with refund', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(4);
      let refundable = await VIVACrowdsaleRound.at(round).refundable();
      expect(refundable).to.be.true;
      let initialWalletBalance = web3.eth.getBalance(PURCHASER_1);
      const value = web3.toWei(1, 'ether');
      let tx = await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      const gasUsed = new BigNumber(tx.receipt.gasUsed).multipliedBy(GAS_PRICE);
      let balance = web3.eth.getBalance(PURCHASER_1);
      let expectedSpent = new BigNumber(value).plus(gasUsed);
      assert.equal(new BigNumber(initialWalletBalance.toString()).minus(new BigNumber(balance.toString())).toString(), expectedSpent.toString());
      await instance.closeRefundVault(true, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.closeRefundVault(true);
      const vault = await instance.refundVault();
      await VIVARefundVault.at(vault).refund(PURCHASER_1);
      balance = web3.eth.getBalance(PURCHASER_1);
      expect(balance.toString()).to.equal(new BigNumber(initialWalletBalance.toString()).minus(new BigNumber(gasUsed)).toString());
      await instance.closeRefundVault(true).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should close refund vault without refund', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(4);
      let refundable = await VIVACrowdsaleRound.at(round).refundable();
      expect(refundable).to.be.true;
      let initialWalletBalance = web3.eth.getBalance(PURCHASER_1);
      const value = web3.toWei(1, 'ether');
      // First purchase
      const tx = await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      const gasUsed = new BigNumber(tx.receipt.gasUsed).multipliedBy(GAS_PRICE);
      let balance = web3.eth.getBalance(PURCHASER_1);
      let expectedSpent = new BigNumber(value).plus(gasUsed);
      assert.equal(new BigNumber(initialWalletBalance.toString()).minus(new BigNumber(balance.toString())).toString(), expectedSpent.toString());
      await instance.closeRefundVault(false);
      const vault = await instance.refundVault();
      await VIVARefundVault.at(vault).refund(PURCHASER_1).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      let balance2 = web3.eth.getBalance(PURCHASER_1);
      expect(balance.toString()).to.equal(balance2.toString());
    });
  });

  it('should finalize', () => {
    return testHelper(async (instance) => {
      await instance.finalize(SOME_ACCOUNT, false, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.finalize(SOME_ACCOUNT, false);
      let isFinalized = await instance.isFinalized();
      expect(isFinalized).to.be.true;
      let refundVaultClosed = await instance.refundVaultClosed();
      expect(refundVaultClosed).to.be.true;
    });
  });

  it('should not allow subsequent finalization', () => {
    return testHelper(async (instance) => {
      await instance.finalize(SOME_ACCOUNT, false);
      await instance.finalize(SOME_ACCOUNT, false).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should finalize with expected token ownership', () => {
    return testHelper(async (instance) => {
      await instance.finalize(SOME_ACCOUNT, false);
      await instance.mintTokens(PURCHASER_1, 50).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      let token = await instance.token();
      let owner = await VIVAToken.at(token).owner();
      expect(SOME_ACCOUNT).to.equal(owner);
    });
  });

  /*
  it('should allow changing wallet address when not finalized', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should set large investor wei if not finalized', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should set large investor approval if not admin', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should return large investor approval', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should blacklist token holder during minting', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should blacklist non-token holder during minting', () => {
    return testHelper(async (instance) => {

    });
  });
  */

});
