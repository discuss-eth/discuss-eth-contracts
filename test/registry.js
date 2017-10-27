import promiseMe from 'mocha-promise-me';
import { Forum, Registry, ZERO_ADDRESS } from './util/constants';

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

    await registry.registerUser(USER_NAME, 0, { from: userOwner });
    userOneNameHash = await hashName(USER_NAME);
  });

  describe('#registerUser', async () => {
    it('prevents two users from registering with the same name', async () => {
      const DUPE_NAME = 'amfdlksmfeopwm';
      await registry.registerUser(DUPE_NAME, 0, { from: nobody });
      promiseMe.thatYouReject(registry.registerUser(DUPE_NAME, 0, { from: nobody }));
    });
  });

  describe('#registerForum', async () => {
    it('prevents two forums from being registered with the same name', async () => {
      const DUPE_NAME = 'my cool forum';
      await registry.registerForum(DUPE_NAME, 0, { from: nobody });
      promiseMe.thatYouReject(registry.registerForum(DUPE_NAME, 0, { from: nobody }));
    });

    it('emits an event', async () => {
      const isForum = await registry.isForum(ZERO_ADDRESS);
      assert.strictEqual(isForum, false);

      const FORUM_NAME = 'unique forum name';
      const registrationTx = await registry.registerForum(FORUM_NAME, 0, { from: nobody });
      //event LogRegisterForum(address indexed administrator, address indexed newForumAddress, bytes32 hashedName, string name);
      assert.strictEqual(registrationTx.logs[ 0 ].event, 'LogRegisterForum');
      assert.strictEqual(registrationTx.logs[ 0 ].args.administrator, nobody);
      const hashedName = await hashName(FORUM_NAME);
      assert.strictEqual(registrationTx.logs[ 0 ].args.hashedName, hashedName);
      assert.strictEqual(registrationTx.logs[ 0 ].args.name, FORUM_NAME);

      const isNewForumAForum = await registry.isForum(registrationTx.logs[ 0 ].args.newForumAddress);
      assert.strictEqual(isNewForumAForum, true);

      const newForum = Forum.at(registrationTx.logs[ 0 ].args.newForumAddress);
      const nextPostId = await newForum.nextPostId();
      assert.strictEqual(nextPostId.valueOf(), '1');
    });
  });


  describe('#incrementReputation', () => {
    it('fails when called by users', async () => {
      const hashedName = await hashName(USER_NAME);
      promiseMe.thatYouReject(registry.incrementReputation(hashedName, 1, { from: nobody }));
      promiseMe.thatYouReject(registry.incrementReputation(hashedName, 1, { from: userOwner }));
      promiseMe.thatYouReject(registry.incrementReputation(hashedName, 1, { from: forumOwner }));
      promiseMe.thatYouReject(registry.incrementReputation(hashedName, 1, { from: registryOwner }));
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
