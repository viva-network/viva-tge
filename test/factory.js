const VIVACrowdsaleRound = artifacts.require('VIVACrowdsaleRound');
const VIVACrowdsaleData = artifacts.require('VIVACrowdsaleData');
const VIVACrowdsale = artifacts.require('VIVACrowdsale');

// FIXME Use in migrations

async function crowdsaleInstance(data, admins, testing) {
  const instance = await VIVACrowdsale.new(data.address, testing);
  await data.setAdmin(instance.address, true);
  for (const admin of admins) {
    await instance.setAdmin(admin, true);
  }
  return instance;
}

async function crowdsaleDataInstance(wallet, rounds, admins, startShift, testing) {
  const time = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  const instance = await VIVACrowdsaleData.new(wallet, time + startShift, testing);
  for (const admin of admins) {
    await instance.setAdmin(admin, true);
  }
  await addRounds(instance);
  return instance;
  async function addRounds(instance) {
    for (const round of rounds) {
      const roundInstance = await VIVACrowdsaleRound.new(round.refundable, round.capAtWei, round.capAtDuration);
      for (const bonus of round.bonuses) {
        await roundInstance.addBonus(bonus.tier, bonus.rate);
      }
      await instance.addRound(roundInstance.address);
    }
  }
}

module.exports = {
  crowdsaleInstance,
  crowdsaleDataInstance
};
