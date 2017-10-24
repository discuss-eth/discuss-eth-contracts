require('babel-register');
require('babel-polyfill');

const _ = require('underscore');
const { INFURA_API_KEY, MNEMONIC } = process.env;
const HDWalletProvider = require('truffle-hdwallet-provider');

const NETWORK_IDS = {
  mainnet: 1,
  ropsten: 2,
  rinkeby: 4,
  kovan: 42
};

module.exports = {
  networks: _.mapObject(
    NETWORK_IDS,
    (network_id, name) => ({
      provider: new HDWalletProvider(MNEMONIC, 'https://' + name + '.infura.io/' + INFURA_API_KEY),
      network_id
    })
  )
};
