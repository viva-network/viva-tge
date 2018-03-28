require('chai')
  .use(require('chai-as-promised'))
  .should();

const testUtils = require('./test-utils');
const factory = require('./factory');
const ROUNDS = require('../rounds');

contract('VIVACrowdsale', async (accounts) => {

  const OWNER = accounts[0];
  const FUND_WALLET = accounts[1];
  const ADMINS = [OWNER]; // For convenience

  async function testHelper(test, rounds, admins, startShift) {
    const data = await factory.crowdsaleDataInstance(
      FUND_WALLET,
      rounds || ROUNDS,
      admins || ADMINS,
      (startShift == null ? testUtils.DAY : startShift),
      true
    );
    const instance = await factory.crowdsaleInstance(data, admins || ADMINS, null, true);
    await test(instance);
  }

  async function simulatePurchase(instance, round, purchase) {
    // TODO
  }

  it('should initialize properly', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should have admin permission on data instance', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should accept private contributions from admin', () => {
    return testHelper(async (instance) => {
      // Check onlyAdmin
    });
  });

  it('should not accept private contributions if cap exceeded', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not accept private contribution if finalized', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get correct rounds with no ETH caps met', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get correct rounds with ETH caps met', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get correct rounds considering both ETH and duration caps', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get empty round if no round in force', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get empty round if any cap of last round is met', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not get token amount if no round in effect', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should get correct token amount for all rounds', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should buy tokens by default', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if finalized', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if no round in effect', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if not exceeding minimum contribution size', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if total sale token cap met', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should not buy tokens if exceeding large investor size without approval', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should buy tokens if exceeding large investor size with approval', () => {
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

  it('should not allow subsequent actions after finalization', () => {
    return testHelper(async (instance) => {

    });
  });

  it('should allow vault closing before finalization', () => {
    return testHelper(async (instance) => {

    });
  });

});
