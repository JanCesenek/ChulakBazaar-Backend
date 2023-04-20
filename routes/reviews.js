const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = new PrismaClient();

router
  .route("/reviews")
  .get(async (req, res) => {
    const reviews = await prisma.reviews.findMany();
    res.json(reviews);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const duplicateReview = await prisma.reviews.findFirst({
      where: {
        sender: data.sender,
        recipient: data.recipient,
      },
    });
    if (data.sender === req.token.username && data.sender !== data.recipient && !duplicateReview) {
      const newReview = await prisma.reviews.create({
        data,
      });
      res.status(201).json({ message: "Review created successfully!", newReview });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to create reviews for other users!",
        },
      });
  });

router.delete("/reviews/:id", checkAuthMiddleWare, async (req, res) => {
  const id = Number(req.params.id);
  const curReview = await prisma.reviews.findUnique({
    where: {
      id,
    },
  });
  if (curReview.sender === req.token.username) {
    const deletedReview = await prisma.reviews.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Review deleted successfully!", deletedReview });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to delete reviews for other users!",
      },
    });
});

module.exports = router;
