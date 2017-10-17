import promiseMe from 'mocha-promise-me';

const Registry = artifacts.require('./Registry.sol');
const User = artifacts.require('./User.sol');
const Forum = artifacts.require('./Forum.sol');

contract('Registry', async accounts => {
  let registry, userAddress, forumAddress, user, forum;
  const [ registryOwner, forumOwner, userOwner ] = accounts;

  const USER_NAME = 'moodysalem';
  const FORUM_NAME = 'Moody\'s super cool forum!';

  async function hashName(name) {
    return await registry.hashName(name);
  }

  beforeEach('create registry', async () => {
    registry = await Registry.new({ from: registryOwner });
  });

  beforeEach('create forum', async () => {
    const registerForumTx = await registry.registerForum(FORUM_NAME, 10, { from: forumOwner });
    forumAddress = registerForumTx.logs.find(log => log.event === 'LogRegisterForum').args.newForumAddress;
    forum = Forum.at(forumAddress);
  });

  beforeEach('create user', async () => {
    const registerUserTx = await registry.registerUser(USER_NAME, { from: userOwner });
    userAddress = registerUserTx.logs.find(log => log.event === 'LogRegisterUser').args.newUserAddress;
    user = User.at(userAddress);
  });


  describe('registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      const DUPE_NAME = 'amfdlksmfeopwm';
      await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] });
      promiseMe.thatYouReject(async () => await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] }));
    });
  });

  describe('users mapping', async () => {
    it('can get user name', async () => {
      const hash = await hashName(USER_NAME);
      const _userAddress = await registry.users(hash);
      assert.strictEqual(userAddress, _userAddress);

      const name = await (User.at(_userAddress).name());
      assert.strictEqual(name, USER_NAME);
    });

    it('returns zero address when user does not exist', async () => {
      promiseMe.thatYouReject(async () => {
        const hash = await hashName('name_does_not_exist');

        assert.strictEqual(
          await registry.users(hash),
          '0x0000000000000000000000000000000000000000'
        );
      });
    });
  });

  describe('forum', async () => {
    describe('setReputationThreshold', async () => {
      it('cannot be called by the registry owner', async () => {
        promiseMe.thatYouReject(async () => await forum.setReputationThreshold(20, { from: registryOwner }));
      });

      it('cannot be called by a user', async () => {
        promiseMe.thatYouReject(async () => await forum.setReputationThreshold(20, { from: userOwner }));
      });

      it('can be called by the forum owner', async () => {
        await forum.setReputationThreshold(20, { from: forumOwner });
        const reputationThreshold = await forum.reputationThreshold();
        assert.strictEqual(reputationThreshold.valueOf(), '20');
      });
    });

  });

});
