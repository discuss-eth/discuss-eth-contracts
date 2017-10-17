import promiseMe from 'mocha-promise-me';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const Registry = artifacts.require('./Registry.sol');
const User = artifacts.require('./User.sol');
const Forum = artifacts.require('./Forum.sol');
const Post = artifacts.require('./Post.sol');

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

  describe('Registry', async () => {
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
            ZERO_ADDRESS
          );
        });
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
          async () => await forum.createThread(userNameHash, 'a great discussion', [], [], { from: userOwner })
        );
      });

      it('allows post if i meet threshold', async () => {
        // set threshold to 0
        await forum.setReputationThreshold(0, { from: forumOwner });

        await forum.createThread(userNameHash, 'a great discussion', [], [], { from: userOwner });
      });

      it('allows post if i exceed threshold', async () => {
        // set threshold to 0
        await forum.setReputationThreshold(-10, { from: forumOwner });

        await forum.createThread(userNameHash, 'a great discussion', [], [], { from: userOwner });
      });

      it('fires an event', async () => {
        await forum.setReputationThreshold(-5, { from: forumOwner });

        const { logs } = await forum.createThread(userNameHash, 'a great discussion', [], [], { from: userOwner });
        assert.strictEqual(logs[ 0 ].event, 'LogNewThread');
        assert.strictEqual(logs[ 0 ].args.sender, userOwner);
        assert.strictEqual(logs[ 0 ].args.user, userAddress);
        assert.strictEqual(logs[ 0 ].args.threadNameHash, await hashName('a great discussion'));
      });

      it('adds to the threads array', async () => {
        // set threshold to 0
        await forum.setReputationThreshold(-10, { from: forumOwner });

        await forum.createThread(userNameHash, 'a great discussion', [], [], { from: userOwner });

        const newThread = await forum.threads(0);

        const post = Post.at(newThread);
        assert.strictEqual(await post.forum(), forum.address);
        assert.strictEqual(await post.inReplyTo(), ZERO_ADDRESS);
        assert.strictEqual(await post.poster(), userAddress);
        assert.strictEqual(await post.subject(), 'a great discussion');
        assert.strictEqual(await post.redacted(), false);
      });
    });
  });

});
