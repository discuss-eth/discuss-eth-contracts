import promiseMe from 'mocha-promise-me';

const Registry = artifacts.require('./Registry.sol');
const User = artifacts.require('./User.sol');
const Forum = artifacts.require('./Forum.sol');

contract('Registry, Forum', async accounts => {
  let registry, userAddress, forumAddress, user, forum, userNameHash;
  const [ registryOwner, forumOwner, userOwner, nobody ] = accounts;

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
    userNameHash = await hashName(USER_NAME);
  });


  describe('#registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      const DUPE_NAME = 'amfdlksmfeopwm';
      await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] });
      promiseMe.thatYouReject(async () => await registry.registerUser(DUPE_NAME, { from: accounts[ 0 ] }));
    });
  });

  describe('#users', async () => {
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

  describe('Forum', async () => {
    describe('#setReputationThreshold', async () => {
      it('cannot be called by registry owner', async () => {
        promiseMe.thatYouReject(async () => await forum.setReputationThreshold(20, { from: registryOwner }));
      });

      it('cannot be called by forum owner', async () => {
        promiseMe.thatYouReject(async () => await forum.setReputationThreshold(20, { from: forumOwner }));
      });

      it('cannot be called by nobody', async () => {
        promiseMe.thatYouReject(async () => await forum.setReputationThreshold(20, { from: nobody }));
      });

      it('can be called by the forum owner', async () => {
        await forum.setReputationThreshold(20, { from: forumOwner });
        const reputationThreshold = await forum.reputationThreshold();
        assert.strictEqual(reputationThreshold.valueOf(), '20');
      });

      it('fires a LogSetReputationThreshold event', async () => {
        const { logs } = await forum.setReputationThreshold(20, { from: forumOwner });
        assert.strictEqual(logs[ 0 ].event, 'LogSetReputationThreshold');
        assert.strictEqual(logs[ 0 ].args.oldReputationThreshold.valueOf(), '10');
        assert.strictEqual(logs[ 0 ].args.newReputationThreshold.valueOf(), '20');
      });
    });

    describe('#createThread', async () => {
      it('requires a registered user', async () => {
        promiseMe.thatYouReject(
          async () => await forum.createThread(userNameHash, 'a great discussion', [], [], { from: nobody })
        );
      });

      it('requires a user that meets the threshold', async () => {
        promiseMe.thatYouReject(
          async () => await forum.createThread(userNameHash, 'a great discussion', [], [], { from: user })
        );
      });
    });
  });

});
