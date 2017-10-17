import { expectError } from './utils';

const Registry = artifacts.require('./Registry.sol');

contract('Registry', async accounts => {
  let registry, forum, user, userAddress, forumAddress;
  const [ registryOwner, forumOwner, userOwner ] = accounts;

  const USER_NAME = 'moodysalem';

  beforeEach('create registry, forum and user', async () => {
    registry = await Registry.new({ from: registryOwner });

    const registerForumTx = await registry.registerForum('Moody\'s super cool forum!', 10, { from: forumOwner });
    forumAddress = registerForumTx.logs.find(log => log.event === 'LogRegisterForum').args.newForumAddress;

    const registerUserTx = await registry.registerUser(USER_NAME, { from: userOwner });
    userAddress = registerUserTx.logs.find(log => log.event === 'LogRegisterUser').args.newUserAddress;
  });

  describe('registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      const DUPE_NAME = 'amfdlksmfeopwm';
      await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] });
      await expectError(async () => await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] }));
    });
  });

  describe('getUser', async () => {
    it('provides the user when it exists', async () => {
      const _userAddress = await registry.getUser(USER_NAME);
      assert.strictEqual(userAddress, _userAddress);
    });

    it('errors when user does not exist', async () => {
      expectError(async () => await registry.getUser('name_does_not_exist'));
    });
  });

});
