import promiseMe from 'mocha-promise-me';
import { ZERO_ADDRESS, Registry, Forum, Post, User } from './util/constants';

contract('Forum', async ([ registryOwner, forumOwner, userOneOwner, nobody ]) => {
  let registry, userOneAddress, forumAddress, userOne, forum, userOneNameHash;

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

    const registerUserTx = await registry.registerUser(USER_NAME, { from: userOneOwner });
    userOneAddress = registerUserTx.logs.find(log => log.event === 'LogRegisterUser').args.newUserAddress;
    userOne = User.at(userOneAddress);
    userOneNameHash = await hashName(USER_NAME);
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
        assert.strictEqual(logs[ 0 ].args.oldReputationThreshold.valueOf(), '0');
        assert.strictEqual(logs[ 0 ].args.newReputationThreshold.valueOf(), '20');
      });
    });

    describe('#post', async () => {
      it('requires a registered user', async () => {
        promiseMe.thatYouReject(
          async () => await forum.post(userOneNameHash, 'a great discussion', [], [], { from: nobody })
        );
      });

      it('requires a user that meets the threshold', async () => {
        await forum.setReputationThreshold(10, { from: forumOwner });

        promiseMe.thatYouReject(
          async () => await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner })
        );
      });

      it('allows post if i meet threshold', async () => {
        await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner });
      });

      it('allows post if i exceed threshold', async () => {
        await forum.setReputationThreshold(-10, { from: forumOwner });

        await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner });
      });

      it('fires an event', async () => {
        const { logs } = await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner });
        assert.strictEqual(logs[ 0 ].event, 'LogNewThread');
        assert.strictEqual(logs[ 0 ].args.sender, userOneOwner);
        assert.strictEqual(logs[ 0 ].args.user, userOneAddress);
        assert.strictEqual(logs[ 0 ].args.threadNameHash, await hashName('a great discussion'));
      });

      it('adds to the threads array', async () => {
        const postTxObject = await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner });
        const newPostAddress = postTxObject.logs.find(log => log.event === 'LogNewThread').args.newThreadAddress;

        const isPost = await forum.isPost(newPostAddress);
        assert.strictEqual(isPost, true);

        const post = Post.at(newPostAddress);
        assert.strictEqual(await post.forum(), forum.address);
        assert.strictEqual(await post.inReplyTo(), ZERO_ADDRESS);
        assert.strictEqual(await post.poster(), userOneAddress);
        assert.strictEqual(await post.subject(), 'a great discussion');
        assert.strictEqual(await post.redacted(), false);
      });
    });

    describe('#reply', async () => {
      it('requires a post address', () => {
        promiseMe.thatYouReject(
          forum.post(ZERO_ADDRESS, userOneNameHash, 'a great discussion', [], [], { from: userOneOwner })
        );
      });

      it('works for post addresses', async () => {
        const postTxObject = await forum.post(userOneNameHash, 'a great discussion', [], [], { from: userOneOwner });
        const newPostAddress = postTxObject.logs.find(log => log.event === 'LogNewThread').args.newThreadAddress;

        const isPost = await forum.isPost(newPostAddress);
        assert.strictEqual(isPost, true);

        // now reply to yourself
        const replyTxObject = await forum.reply(newPostAddress, userOneNameHash, 'i disagree', [], [], { from: userOneOwner });
        const log = replyTxObject.logs.find(log=>log.event==='LogNewReply');

        assert.strictEqual(log.args.inReplyTo, newPostAddress);
        assert.strictEqual(log.args.sender, userOneOwner);

        const isReplyPost = await forum.isPost(log.args.replyAddress);
        assert.strictEqual(isReplyPost, true);
      });
    });
  });

});
