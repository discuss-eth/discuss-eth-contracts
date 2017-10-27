require('babel-register');
require('babel-polyfill');

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const MNEMONIC = process.env.MNEMONIC;
const HDWalletProvider = require('truffle-hdwallet-provider');

const NETWORK_IDS = {
  mainnet: 1,
  ropsten: 2,
  rinkeby: 4,
  kovan: 42
};

module.exports = {
  networks: {}
};

for (let networkName in NETWORK_IDS) {
  module.exports.networks[ networkName ] = {
    provider: new HDWalletProvider(MNEMONIC, 'https://' + networkName + '.infura.io/' + INFURA_API_KEY),
    network_id: NETWORK_IDS[ networkName ],
    // use 1 gwei for the gas price instead of 100 gwei
    gasPrice: Math.pow(10, 9),
    // 4 million gas
    gas: Math.pow(10, 6) * 4
  };
}