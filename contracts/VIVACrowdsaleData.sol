pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './Administrated.sol';
import './VIVACrowdsaleRound.sol';
import './VIVAToken.sol';
import './VIVARefundVault.sol';
import './CrowdsaleTokenUtils.sol';

contract VIVACrowdsaleData is Administrated {

  using SafeMath for uint256;

  // Events
  event MintTokens(address beneficiary, uint256 tokens);

  event CloseRefundVault(bool refund);
  event Finalize(address tokenOwner, bool refundable);
  event RegisterPrivateContribution(address beneficiary, uint256 tokens);
  event RegisterPurchase(VIVACrowdsaleRound round, address beneficiary, uint256 tokens, uint256 weiAmount);
  event UnregisterPurchase(address beneficiary, uint256 tokens, uint256 weiAmount);

  VIVAToken public token;

  uint256 public startTime;

  bool public isFinalized = false;

  VIVACrowdsaleRound[] public rounds;

  // Main fund collection (refundable)
  address public wallet;
  VIVARefundVault public refundVault;
  bool public refundVaultClosed = false;

  // Distribution vaults
  address public bountyVault;
  address public reserveVault;
  address public teamVault;
  address public advisorVault;

  // Track general sale progress
  uint256 public privateContributionTokens;
  mapping(address => uint256) internal weiContributed;
  uint256 public mintedForSaleTokens; // Total general sale tokens minted
  uint256 public weiRaisedForSale;

  // Verified investors only for > 7ETH (must be pre-approved)
  uint256 public largeInvestorWei = 7000000000000000000; // 7 ETH
  mapping(address => uint256) internal approvedLargeInvestors; // And their authorized limits

  function VIVACrowdsaleData(
    VIVAToken _token,
    address _wallet,
    uint256 _startTime
  )  public {
      require(_token != address(0));
      require(_wallet != address(0));
      token = _token;
      wallet = _wallet;
      startTime = _startTime;
      refundVault = new VIVARefundVault(_wallet);
  }

  function getNumRounds() public view returns (uint256) {
    return rounds.length;
  }

  function addRound(VIVACrowdsaleRound round) public onlyAdmin {
    require(address(round) != address(0));
    rounds.push(round);
  }

  function removeRound(uint256 i) public onlyAdmin {
    while (i < rounds.length - 1) {
      rounds[i] = rounds[i+1];
      i++;
    }
    rounds.length--;
  }

  function setStartTime(uint256 _startTime) public onlyAdmin {
    startTime = _startTime;
  }

  function mintTokens(address beneficiary, uint256 tokens) public onlyAdmin returns (bool) {
    return CrowdsaleTokenUtils.mintTokens(token, beneficiary, tokens);
  }

  function registerPrivateContribution(address beneficiary, uint256 tokens) public onlyAdmin returns (bool) {
    require(beneficiary != address(0));
    privateContributionTokens = privateContributionTokens.add(tokens);
    RegisterPrivateContribution(beneficiary, tokens);
    return true;
  }

  function registerPurchase(VIVACrowdsaleRound round, address beneficiary, uint256 tokens) public payable onlyAdmin returns (bool) {
    require(address(round) != address(0));
    require(beneficiary != address(0));
    if(round.refundable()) {
      refundVault.deposit.value(msg.value)(beneficiary);
    } else {
      wallet.transfer(msg.value);
    }
    weiContributed[beneficiary] = msg.value.add(weiContributed[beneficiary]);
    weiRaisedForSale = weiRaisedForSale.add(msg.value);
    mintedForSaleTokens = mintedForSaleTokens.add(tokens);
    RegisterPurchase(round, beneficiary, tokens, msg.value);
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
    CloseRefundVault(refund);
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
    Finalize(tokenOwner, refundable);
  }

  function setWallet(address _wallet) public onlyAdmin {
    require(_wallet != address(0));
    wallet = _wallet;
    refundVault.setWallet(_wallet);
  }

  function setLargeInvestorWei(uint256 _largeInvestorWei) public onlyAdmin {
    require(_largeInvestorWei >= 0);
    largeInvestorWei = _largeInvestorWei;
  }

  function getLargeInvestorApproval(address beneficiary) public view returns (uint256) {
    require(beneficiary != address(0));
    return approvedLargeInvestors[beneficiary];
  }

  function setLargeInvestorApproval(address beneficiary, uint256 weiLimit) public onlyAdmin {
    require(beneficiary != address(0));
    require(weiLimit >= largeInvestorWei);
    approvedLargeInvestors[beneficiary] = weiLimit;
  }

  function setBountyVault(address vault) public onlyAdmin  { bountyVault = vault;  }
  function setReserveVault(address vault) public onlyAdmin { reserveVault = vault; }
  function setTeamVault(address vault) public onlyAdmin    { teamVault = vault;    }
  function setAdvisorVault(address vault) public onlyAdmin { advisorVault = vault; }

}
