const Session = require("../models/session");
const io = require("../socket");

exports.sendMessage = async (req, res, next) => {
  try {
    // lay sessionId
    let sessionId = req.body.sessionId || "";
    let session;

    const chat = {
      userId: req.body.userId || null,
      text: req.body.text,
      type: req.body.type,
      time: new Date(),
    };

    // Neu da co sessionId
    if (sessionId) {
      session = await Session.findById(sessionId);

      // khong tim thay phien chay hoac phien chat da ket thuc
      if (!session || session.isEnd) {
        const err = new Error("The chat session has ended.");
        err.statusCode = 404;
        throw err;
      }

      session.content.push(chat);
    } else {
      session = new Session({
        isEnd: false,
        content: [chat],
      });
    }

    const resSession = await session.save();
    sessionId = resSession._id.toString();

    io.getIO()
      .to(sessionId)
      .emit("message", {
        action: "send",
        payload: {
          ok: true,
          _id: resSession._id.toString(),
          ...chat,
        },
      });

    io.getIO()
      .to("admin chat")
      .emit("message", {
        action: "send",
        payload: {
          ok: true,
          _id: resSession._id.toString(),
          ...chat,
        },
      });

    // tra ve thong tin xu ly message
    return res.status(201).json({
      message: "Send message successful!",
      chat: {
        _id: resSession._id.toString(),
        ...chat,
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// lay noi dung chat
exports.getById = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId).where({ isEnd: false });

    if (!session) {
      const err = new Error("The chat session has ended.");
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      message: "Load data sucessful!",
      chat: {
        _id: session._id.toString(),
        content: session.content,
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// close phien chat
exports.closeSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId).where({ isEnd: false });

    if (!session) {
      const err = new Error("The chat session has ended.");
      err.statusCode = 404;
      throw err;
    }

    session.isEnd = true;
    await session.save();

    io.getIO()
      .to(sessionId)
      .emit("message", {
        action: "close",
        payload: {
          _id: sessionId,
          ok: true,
        },
      });

    io.getIO()
      .to("admin chat")
      .emit("message", {
        action: "close",
        payload: {
          _id: sessionId,
          ok: true,
        },
      });

    return res.status(200).json({
      message: "Close session chat sucessful!",
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// lay tat ca cac phien chat dang hoat dong
exports.getAll = async (req, res, next) => {
  try {
    const sessions = await Session.find({ isEnd: false });

    return res.status(200).json({
      message: "Load data sucessful!",
      chats: sessions.map((session) => {
        return {
          _id: session._id.toString(),
          content: session.content,
        };
      }),
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
