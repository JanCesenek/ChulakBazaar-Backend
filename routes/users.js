const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/users", async (req, res) => {
  const users = await prisma.users.findMany();
  res.json(users);
});

router.delete("/users/:username", checkAuthMiddleWare, async (req, res) => {
  const username = req.params.username;
  const curUser = await prisma.users.findUnique({
    where: {
      username,
    },
  });
  if (username === req.token.username || req.token.admin) {
    const deletedUser = await prisma.users.delete({
      where: {
        username,
      },
    });
    res.status(201).json({ message: "User deleted successfully!", deletedUser });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to delete other users!",
      },
    });
});

module.exports = router;
