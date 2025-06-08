const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/messages")
  .get(async (req, res) => {
    const messages = await prisma.bazaar_messages.findMany();
    res.json(messages);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const frozenChat = await prisma.bazaar_messages.findFirst({
      where: {
        OR: [
          {
            sender: data.sender,
            recipient: data.recipient,
            frozen: true,
          },
          {
            sender: data.recipient,
            recipient: data.sender,
            frozen: true,
          },
        ],
      },
    });
    if (
      data.sender === req.token.username &&
      data.sender !== data.recipient &&
      !data.system &&
      !frozenChat
    ) {
      const newMessage = await prisma.bazaar_messages.create({
        data,
      });
      res.status(201).json({ message: "Message sent successfully!", newMessage });
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to send messages for other users!",
        },
      });
  })
  .patch(checkAuthMiddleWare, async (req, res) => {
    if (req.body.username === req.token.username) {
      const readMessages = await prisma.bazaar_messages.updateMany({
        where: {
          recipient: req.body.username,
          sender: req.body.sender,
        },
        data: {
          read: true,
        },
      });
      res.status(201).json({ message: "Messages read successfully!", readMessages });
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to read messages for other users!",
        },
      });
  });

router.delete("/messages/:id", checkAuthMiddleWare, async (req, res) => {
  const id = Number(req.params.id);
  const curMessage = await prisma.bazaar_messages.findUnique({
    where: {
      id,
    },
  });
  if (req.token.username === curMessage.sender) {
    const deletedMessage = await prisma.bazaar_messages.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Message deleted successfully!", deletedMessage });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to delete messages for other users!",
      },
    });
});

router.post("/freeze", checkAuthMiddleWare, async (req, res) => {
  const data = req.body;
  const alreadyFrozen = await prisma.bazaar_messages.findFirst({
    where: {
      sender: data.sender,
      recipient: data.recipient,
      frozen: true,
    },
  });
  if (data.sender === req.token.username && !alreadyFrozen) {
    const frozenChat = await prisma.bazaar_messages.create({
      data,
    });
    res.status(201).json({ message: "Chat frozen successfully!", frozenChat });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to freeze chat for other users!",
      },
    });
});

router.delete("/freeze/:sender/:recipient", checkAuthMiddleWare, async (req, res) => {
  const sender = req.params.sender;
  const recipient = req.params.recipient;
  if (sender === req.token.username) {
    const unfrozenChat = await prisma.bazaar_messages.deleteMany({
      where: {
        sender,
        recipient,
        frozen: true,
      },
    });
    res.status(201).json({ message: "Chat unfrozen successfully!", unfrozenChat });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to unfreeze chat for other users!",
      },
    });
});

module.exports = router;
