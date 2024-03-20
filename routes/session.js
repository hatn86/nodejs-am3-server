const express = require("express");

const sessionController = require("../controllers/session");

const { isAuth } = require("../middlewares/is-auth");

const router = express.Router();

// POST: /session/send
router.post("/send", isAuth, sessionController.sendMessage);

// POST: /session/get/:sessionId
router.post("/get/:sessionId", isAuth, sessionController.getById);

// PUT: /session/close/:sessionId
router.put("/close/:sessionId", isAuth, sessionController.closeSession);

// GET: /session/get
router.get("/get", isAuth, sessionController.getAll);

module.exports = router;
