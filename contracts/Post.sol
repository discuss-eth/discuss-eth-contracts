pragma solidity 0.4.17;

import "./Forum.sol";
import "./User.sol";
import "./Registry.sol";

contract Post {
  struct Attachment {
    bytes32 ipfsHash;
    bytes32 name;
  }

  // the forum in which the post resides
  Forum public forum;
  // the post being replied to
  address public inReplyTo;
  // address of the user that made the post
  User public poster;

  // the attachments to the post
  Attachment[] public attachments;

  // the subject of the post
  string public subject;

  // the list of the replies
  Post[] public replies;

  // whether the owner wishes for this comment to be visible
  bool public redacted;

  function Post(
    Forum _forum, address _inReplyTo,
    User _poster, string _subject,
    bytes32[] contentHashes, bytes32[] filenames
  ) public {
    require(contentHashes.length == filenames.length);

    forum = _forum;
    inReplyTo = _inReplyTo;
    poster = _poster;
    subject = _subject;

    for (uint index = 0; index < contentHashes.length; index++) {
      attachments.push(
        Attachment({
          ipfsHash: contentHashes[index],
          name: filenames[index]
        })
      );
    }
  }


}
