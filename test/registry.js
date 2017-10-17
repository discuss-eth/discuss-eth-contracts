import promiseMe from 'mocha-promise-me';
import { ZERO_ADDRESS, Registry, Forum, User } from './util/constants';

contract('Registry', async ([ registryOwner, forumOwner, userOwner, nobody ]) => {
  let registry, userAddress, forumAddress, user, forum, userNameHash;

  const USER_NAME = 'moodysalem';
  const FORUM_NAME = 'Moody\'s super cool forum!';

  async function hashName(name) {
    return await registry.hashName(name);
  }

  beforeEach('create registry, forum, user', async () => {
    registry = await Registry.new({ from: registryOwner });

    const registerForumTx = await registry.registerForum(FORUM_NAME, 10, { from: forumOwner });
    forumAddress = registerForumTx.logs.find(log => log.event === 'LogRegisterForum').args.newForumAddress;
    forum = Forum.at(forumAddress);

    const registerUserTx = await registry.registerUser(USER_NAME, { from: userOwner });
    userAddress = registerUserTx.logs.find(log => log.event === 'LogRegisterUser').args.newUserAddress;
    user = User.at(userAddress);
    userNameHash = await hashName(USER_NAME);
  });

  describe('Registry', async () => {
    describe('#registerUser', async () => {
      it('prevents two users from registering with the same name', async () => {
        const DUPE_NAME = 'amfdlksmfeopwm';
        await registry.registerUser(DUPE_NAME, { from: nobody });
        promiseMe.thatYouReject(async () => await registry.registerUser(DUPE_NAME, { from: nobody }));
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

});
