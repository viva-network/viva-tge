const DAY = 1000 * 60 * 60 * 24;
const REQUIRE_FAIL = 'VM Exception while processing transaction: revert';

function now() {
  return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
}

module.exports = {
  DAY,
  REQUIRE_FAIL,
  now
};
