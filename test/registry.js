import { expectError } from './utils';

const Registry = artifacts.require('./Registry.sol');

contract('Registry', async accounts => {
  let registry, forum, user;
  const [registryOwner,forumOwner,userOwner] = accounts;

  beforeEach('create registry, forum and user', async () => {
    registry = await Registry.new({ from: registryOwner });
    const registerForumTx = await registry.registerForum('Moody\'s super cool forum!', 10, { from: forumOwner });
    const registerUserTx = await registry.registerUser('Moody Salem', { from: userOwner });
  });

  describe('registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      await registry.registerUser('moody', { from: accounts[ 0 ] });
      await expectError(async () => await registry.registerUser('moody', { from: accounts[ 0 ] }));
    });
  });

});
