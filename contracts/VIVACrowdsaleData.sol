pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './Testable.sol';
import './Administrated.sol';
import './VIVACrowdsaleRound.sol';
import './VIVAToken.sol';
import './VIVAVestingVault.sol';
import './VIVAVault.sol';
import './VIVARefundVault.sol';

contract VIVACrowdsaleData is Administrated, Testable {

  using SafeMath for uint256;

  uint256 public constant tokensTotalSupply = 4000000000;
  VIVAToken public token;

  uint256 public startTime;

  bool public isFinalized = false;

  VIVACrowdsaleRound[] public rounds;

  // Distribution vaults
  VIVAVault public bountyVault;
  VIVAVault public reserveVault;
  VIVAVestingVault public teamVault;
  VIVAVestingVault public advisorVault;

  // Main fund collection (refundable)
  address public wallet;
  VIVARefundVault public refundVault;
  bool public refundVaultClosed = false;

  // Track general sale progress
  uint256 public privateContributionTokens;
  mapping(address => uint256) internal weiContributed;
  uint256 public mintedForSaleTokens; // Total general sale tokens minted
  uint256 public weiRaisedForSale;

  // Verified investors only for > 7ETH (must be pre-approved)
  uint256 public largeInvestorWei = 7000000000000000000; // 7 ETH
  mapping(address => uint256) internal approvedLargeInvestors; // And their authorized limits
  // Unauthorized purchasers (if KYC not completed, tokens will be revoked and ETH returned)
  mapping(address => bool) internal blacklisted;

  function VIVACrowdsaleData(
    address _wallet,
    uint256 _startTime,
    bool _testing
  ) Testable(_testing) public {
      require(_wallet != address(0));
      wallet = _wallet;
      startTime = _startTime;
      refundVault = new VIVARefundVault(_wallet);
      token = new VIVAToken(tokensTotalSupply, ~uint256(0));
  }

  function getNumRounds() public view returns (uint256) {
    return rounds.length;
  }

  function addRound(VIVACrowdsaleRound round) public onlyAdmin {
    require(address(round) != address(0));
    rounds.push(round);
  }

  function setStartTime(uint256 _startTime) public onlyAdmin {
    startTime = _startTime;
  }

  function mintTokens(address beneficiary, uint256 tokens) public onlyAdmin returns (bool) {
    require(beneficiary != address(0));
    require(tokens > 0);
    return token.mint(beneficiary, tokens);
  }

  function revokeMint(address beneficiary, uint256 tokens) public onlyAdmin returns (bool) {
    require(beneficiary != address(0));
    require(tokens > 0);
    return token.revokeMint(beneficiary, tokens);
  }

  function registerPrivateContribution(address beneficiary, uint256 tokens) public onlyAdmin returns (bool) {
    require(beneficiary != address(0));
    require(tokens > 0);
    privateContributionTokens = privateContributionTokens.add(tokens);
    return true;
  }

  function registerPurchase(VIVACrowdsaleRound round, address beneficiary, uint256 tokens) public payable onlyAdmin returns (bool) {
    require(address(round) != address(0));
    require(beneficiary != address(0));
    require(tokens >= 0);
    require(msg.value >= 0);
    if(round.refundable()) {
      refundVault.deposit.value(msg.value)(beneficiary);
    } else {
      wallet.transfer(msg.value);
    }
    weiContributed[beneficiary] = msg.value.add(weiContributed[beneficiary]);
    weiRaisedForSale = weiRaisedForSale.add(msg.value);
    mintedForSaleTokens = mintedForSaleTokens.add(tokens);
    return true;
  }

  function getWeiContributed(address from) public view returns (uint256) { return weiContributed[from];  }

  function closeRefundVault(bool refund) public onlyAdmin {
    require(!refundVaultClosed);
    refundVaultClosed = true;
    if(refund) {
      refundVault.enableRefunds();
    } else {
      refundVault.close();
    }
  }

  function finalize(address tokenOwner, bool refundable) public onlyAdmin {
    require(tokenOwner != address(0));
    require(!isFinalized);
    isFinalized = true;
    if(!refundVaultClosed) {
      closeRefundVault(refundable);
    }
    token.finishMinting();
    token.transferOwnership(tokenOwner);
  }

  function setWallet(address _wallet) public onlyAdmin {
    require(!isFinalized);
    require(_wallet != address(0));
    wallet = _wallet;
    refundVault.setWallet(_wallet);
  }

  function setLargeInvestorWei(uint256 _largeInvestorWei) public onlyAdmin {
    require(!isFinalized);
    require(_largeInvestorWei >= 0);
    largeInvestorWei = _largeInvestorWei;
  }

  function getLargeInvestorApproval(address beneficiary) public view returns (uint256) {
    require(beneficiary != address(0));
    return approvedLargeInvestors[beneficiary];
  }

  function setLargeInvestorApproval(address beneficiary, uint256 weiLimit) public onlyAdmin {
    require(beneficiary != address(0));
    require(!isFinalized);
    require(weiLimit >= largeInvestorWei);
    approvedLargeInvestors[beneficiary] = weiLimit;
  }

  function isBlacklisted(address beneficiary) public view returns (bool) {
    require(beneficiary != address(0));
    return blacklisted[beneficiary];
  }

  function blacklist(address beneficiary, bool _blacklist) public onlyAdmin {
    require(beneficiary != address(0));
    blacklisted[beneficiary] = _blacklist;
  }

  function unregisterPurchase(address beneficiary, uint256 tokens, uint256 weiAmount) public onlyAdmin returns (bool) {
    require(beneficiary != address(0));
    require(tokens >= 0);
    require(tokens <= token.balanceOf(beneficiary));
    require(weiAmount <= weiContributed[beneficiary]);
    mintedForSaleTokens = mintedForSaleTokens.sub(tokens);
    weiRaisedForSale = weiRaisedForSale.sub(weiAmount);
    weiContributed[beneficiary] = weiContributed[beneficiary].sub(weiAmount);
  }

  function setBountyVault(VIVAVault vault) public onlyAdmin         { bountyVault = vault;  }
  function setReserveVault(VIVAVault vault) public onlyAdmin        { reserveVault = vault; }
  function setTeamVault(VIVAVestingVault vault) public onlyAdmin    { teamVault = vault;    }
  function setAdvisorVault(VIVAVestingVault vault) public onlyAdmin { advisorVault = vault; }

}
