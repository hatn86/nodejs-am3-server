const Session = require("../models/session");

// save message to db
exports.sendMessage = async (sessionId, content) => {
  let session;

  const chat = {
    userId: content.userId || null,
    text: content.text,
    type: content.type,
    time: new Date(),
  };

  // Neu da co sessionId
  if (sessionId) {
    session = await Session.findById(sessionId);

    // khong tim thay phien chay hoac phien chat da ket thuc
    if (!session || session.isEnd) {
      return {
        status: 404,
        ok: false,
        message: "The chat session has ended.",
      };
    }

    session.content.push(chat);
  } else {
    session = new Session({
      isEnd: false,
      content: [chat],
    });
  }

  const resSession = await session.save();

  return {
    status: 201,
    ok: true,
    message: "Send message successful!",
    _id: resSession._id.toString(),
    ...chat,
  };
};

// close session chat
exports.closeSession = async (sessionId) => {
  const session = await Session.findById(sessionId).where({ isEnd: false });

  if (!session) {
    return {
      ok: false,
      status: 404,
      message: "The chat session has ended.",
      _id: sessionId,
    };
  }

  session.isEnd = true;
  await session.save();

  return {
    ok: true,
    status: 200,
    message: "Close session chat sucessful!",
    _id: sessionId,
  };
};
