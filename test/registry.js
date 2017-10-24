import promiseMe from 'mocha-promise-me';
import { ZERO_ADDRESS, Registry, Forum } from './util/constants';

contract('Registry', async ([ registryOwner, forumOwner, userOwner, nobody ]) => {
  let registry, forumAddress, forum, userOneNameHash;

  const USER_NAME = 'moodysalem';
  const FORUM_NAME = 'Moody\'s super cool forum!';

  async function hashName(name) {
    return await registry.hashName(name);
  }

  beforeEach('create registry, forum, user', async () => {
    registry = await Registry.new({ from: registryOwner });

    const registerForumTx = await registry.registerForum(FORUM_NAME, 0, { from: forumOwner });
    forumAddress = registerForumTx.logs.find(log => log.event === 'LogRegisterForum').args.newForumAddress;
    forum = Forum.at(forumAddress);

    const registerUserTx = await registry.registerUser(USER_NAME, 0, { from: userOwner });
    userOneNameHash = await hashName(USER_NAME);
  });

  describe('#registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      const DUPE_NAME = 'amfdlksmfeopwm';
      await registry.registerUser(DUPE_NAME, 0, { from: nobody });
      promiseMe.thatYouReject(registry.registerUser(DUPE_NAME, 0, { from: nobody }));
    });
  });

  describe('#users', async () => {
    it('can get user name', async () => {
      const hash = await hashName(USER_NAME);
      const [ , , , name ] = await registry.users(hash);

      assert.strictEqual(name, USER_NAME);
    });

    it('returns zero address when user does not exist', async () => {
      const hash = await hashName('name_does_not_exist');

      const [ owner, avatarHash, reputation, name ] = await registry.users(hash);

      assert.strictEqual(
        owner,
        ZERO_ADDRESS
      );
    });
  });
});
