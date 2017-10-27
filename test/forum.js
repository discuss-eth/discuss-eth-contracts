import promiseMe from 'mocha-promise-me';
import { Forum, Registry } from './util/constants';

const POST_SUBJECT = 'a great discussion';

contract('Forum', async ([ registryOwner, forumOwner, userOneOwner, nobody ]) => {
  let registry, forumAddress, forum, userOneNameHash, exampleContentHash;

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

    const registerUserTx = await registry.registerUser(USER_NAME, 0, { from: userOneOwner });
    userOneNameHash = await hashName(USER_NAME);

    exampleContentHash = await hashName('this is a really good discussion of the state of affairs');
  });


  describe('#setReputationThreshold', async () => {
    it('cannot be called by registry owner', async () => {
      promiseMe.thatYouReject(forum.setReputationThreshold(20, { from: registryOwner }));
    });

    it('cannot be called by nobody', async () => {
      promiseMe.thatYouReject(forum.setReputationThreshold(20, { from: nobody }));
    });

    it('can be called by the forum owner', async () => {
      await forum.setReputationThreshold(20, { from: forumOwner });
      const reputationThreshold = await forum.reputationThreshold();
      assert.strictEqual(reputationThreshold.valueOf(), '20');
    });

    it('fires a LogSetReputationThreshold event', async () => {
      const { logs } = await forum.setReputationThreshold(20, { from: forumOwner });
      assert.strictEqual(logs[ 0 ].event, 'LogSetReputationThreshold');
      assert.strictEqual(logs[ 0 ].args.oldReputationThreshold.valueOf(), '0');
      assert.strictEqual(logs[ 0 ].args.newReputationThreshold.valueOf(), '20');
    });
  });

  /**
   * post(
   uint inReplyTo, bytes32 userNameHash,
   string subject, bytes32 bodyHash,
   bytes32[] contentHashes, bytes32[] contentFilenames
   )
   event LogPost(bytes32 indexed userNameHash, bytes32 indexed threadKey, uint inReplyTo, address sender, uint newPostId);
   */
  describe('#post', async () => {
    it('requires a registered user', async () => {
      promiseMe.thatYouReject(
        forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: nobody })
      );
    });

    it('requires a user that meets the threshold', async () => {
      await forum.setReputationThreshold(10, { from: forumOwner });

      promiseMe.thatYouReject(
        forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: userOneOwner })
      );
    });

    it('allows post if i meet threshold', async () => {
      const result = await forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: userOneOwner });
      const { logs: [ log ] } = result;
      assert.strictEqual(log.event, 'LogPost');
      assert.strictEqual(log.args.userNameHash, userOneNameHash);
      const subjectHash = await hashName(POST_SUBJECT);
      assert.strictEqual(log.args.threadKey, subjectHash);
      assert.strictEqual(log.args.inReplyTo.valueOf(), '0');
      assert.strictEqual(log.args.sender, userOneOwner);
      assert.strictEqual(log.args.newPostId.valueOf(), '1');
    });

    it('allows post if i exceed threshold', async () => {
      await forum.setReputationThreshold(-10, { from: forumOwner });

      await forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: userOneOwner });
    });

    it('fires an event', async () => {
      const { logs } =
        await forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: userOneOwner });

      const subjectHash = await hashName(POST_SUBJECT);
      assert.strictEqual(logs[ 0 ].event, 'LogPost');
      assert.strictEqual(logs[ 0 ].args.sender, userOneOwner);
      assert.strictEqual(logs[ 0 ].args.threadKey, subjectHash);
    });
  });

  describe('#castVote', async () => {
    it('allows a user to cast a vote', async () => {
      const postTx = await forum.post(0, userOneNameHash, POST_SUBJECT, exampleContentHash, [], [], { from: userOneOwner });

      const postId = postTx.logs[ 0 ].args.newPostId;
      const voteTx = await forum.castVote(postId, userOneNameHash, 1, { from: userOneOwner });
      assert.strictEqual(voteTx.logs[ 0 ].event, 'LogVote');
    });
  });

});
