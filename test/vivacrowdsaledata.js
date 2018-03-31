require('chai')
  .use(require('chai-as-promised'))
  .should();

require('truffle-test-utils').init();

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
  const FUND_WALLET_1 = accounts[1];
  const FUND_WALLET_2 = accounts[6];
  const PURCHASER_1 = accounts[2];
  const PURCHASER_2 = accounts[3];
  const SOME_ACCOUNT = accounts[4];
  const SOME_OTHER_ACCOUNT = accounts[7];
  const ADMINS = [OWNER, PURCHASER_1, PURCHASER_2];
  const NOT_ADMIN = accounts[5];
  const TOKENS_TOTAL_SUPPLY = 4000000000;

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
      FUND_WALLET_1,
      rounds || ROUNDS,
      admins || ADMINS,
      (startShift == null ? testUtils.DAY : startShift),
      TOKENS_TOTAL_SUPPLY,
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
      expect(wallet).to.equal(FUND_WALLET_1);
    });
  });

  it('should initially pause token', () => {
    return testHelper(async (instance) => {
      let token = await instance.token();
      let paused = await VIVAToken.at(token).paused();
      expect(paused).to.be.true;
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
      let result = await instance.setStartTime(firstStartTime.toNumber() + testUtils.DAY);
      let secondStartTime = await instance.startTime();
      expect(secondStartTime.toNumber() - firstStartTime.toNumber()).to.equal(testUtils.DAY);
      await instance.setStartTime(secondStartTime + testUtils.DAY, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should mint tokens', () => {
    return testHelper(async (instance) => {
      let result = await instance.mintTokens(SOME_ACCOUNT, 50);
      expect(testUtils.hadEvent(result, 'MintTokens')).to.be.true;
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
      let result = await instance.registerPrivateContribution(PURCHASER_1, 50);
      expect(testUtils.hadEvent(result, 'RegisterPrivateContribution')).to.be.true;
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
      let result = await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      expect(testUtils.hadEvent(result, 'RegisterPurchase')).to.be.true;
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
      let initialWalletBalance = web3.eth.getBalance(FUND_WALLET_1);
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
      balance = web3.eth.getBalance(FUND_WALLET_1);
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
      let result = await instance.closeRefundVault(true);
      expect(testUtils.hadEvent(result, 'CloseRefundVault', {
        refund: true
      })).to.be.true;
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
      let result = await instance.closeRefundVault(false);
      expect(testUtils.hadEvent(result, 'CloseRefundVault', {
        refund: false
      })).to.be.true;
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
      let result = await instance.finalize(SOME_ACCOUNT, false);
      expect(testUtils.hadEvent(result, 'Finalize', {
        tokenOwner: SOME_ACCOUNT,
        refundable: false
      })).to.be.true;
      let isFinalized = await instance.isFinalized();
      expect(isFinalized).to.be.true;
      let refundVaultClosed = await instance.refundVaultClosed();
      expect(refundVaultClosed).to.be.true;
    });
  });

  it('should not allow subsequent finalization', () => {
    return testHelper(async (instance) => {
      let result = await instance.finalize(SOME_ACCOUNT, false);
      expect(testUtils.hadEvent(result, 'Finalize')).to.be.true;
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

  it('should allow changing wallet address when not finalized and not refundable', () => {
    return testHelper(async (instance) => {
      let round = await instance.rounds(0);
      let refundable = await VIVACrowdsaleRound.at(round).refundable();
      expect(refundable).to.be.false;
      const value = web3.toWei(1, 'ether');
      // First purchase goes to fund wallet 1
      let fundWallet1Balance1 = web3.eth.getBalance(FUND_WALLET_1);
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      let fundWallet1Balance2 = web3.eth.getBalance(FUND_WALLET_1);
      assert.equal(fundWallet1Balance2.toNumber() - fundWallet1Balance1.toNumber(), value);
      // Change wallet address
      await instance.setWallet('0x0').should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      let result = await instance.setWallet(FUND_WALLET_2);
      // Second purchase goes to fund wallet 2
      let fundWallet2Balance1 = web3.eth.getBalance(FUND_WALLET_2);
      await instance.registerPurchase(round, PURCHASER_1, 50, {
        value,
        from: PURCHASER_1
      });
      let fundWallet2Balance2 = web3.eth.getBalance(FUND_WALLET_2);
      assert.equal(fundWallet2Balance2.toNumber() - fundWallet2Balance1.toNumber(), value);
      let fundWallet1Balance3 = web3.eth.getBalance(FUND_WALLET_1);
      assert.equal(fundWallet1Balance2.toNumber(), fundWallet1Balance3.toNumber());
      // Finalize, cannot change wallet
      await instance.finalize(SOME_ACCOUNT, false);
      await instance.setWallet(FUND_WALLET_1).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should set large investor wei', () => {
    return testHelper(async (instance) => {
      let wei = await instance.largeInvestorWei();
      const change = 1000;
      let result = await instance.setLargeInvestorWei(new BigNumber(wei.toString()).plus(change).toString());
      let wei2 = await instance.largeInvestorWei();
      expect(new BigNumber(wei2.toString()).minus(new BigNumber(wei.toString())).toNumber()).to.equal(change);
      await instance.setLargeInvestorWei(new BigNumber(wei2.toString()).plus(change).toString(), {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
    });
  });

  it('should set large investor approval if not admin', () => {
    return testHelper(async (instance) => {
      let approval = await instance.getLargeInvestorApproval(SOME_ACCOUNT);
      expect(approval.toNumber()).to.equal(0);
      let limit = await instance.largeInvestorWei();
      const newLimit = limit.toNumber() + 1000;
      await instance.setLargeInvestorApproval(SOME_ACCOUNT, newLimit, {
        from: NOT_ADMIN
      }).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      await instance.setLargeInvestorApproval(SOME_ACCOUNT, limit.toNumber() - 1000).should.be.rejectedWith(testUtils.REQUIRE_FAIL);
      let result = await instance.setLargeInvestorApproval(SOME_ACCOUNT, newLimit);
      let approval2 = await instance.getLargeInvestorApproval(SOME_ACCOUNT);
      expect(approval2.toNumber()).to.equal(newLimit);
      let otherApproval = await instance.getLargeInvestorApproval(SOME_OTHER_ACCOUNT);
      expect(otherApproval.toNumber()).to.equal(0);
    });
  });

});
