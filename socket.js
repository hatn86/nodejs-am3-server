let io;

module.exports = {
  init: (httpServer, opt) => {
    io = require("socket.io")(httpServer, opt);
    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not initialized");
    } else return io;
  },
};
