const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/reviews")
  .get(async (req, res) => {
    const reviews = await prisma.bazaar_reviews.findMany();
    res.json(reviews);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const duplicateReview = await prisma.bazaar_reviews.findFirst({
      where: {
        sender: data.sender,
        recipient: data.recipient,
      },
    });
    if (data.sender === req.token.username && data.sender !== data.recipient && !duplicateReview) {
      const newReview = await prisma.bazaar_reviews.create({
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
  const curReview = await prisma.bazaar_reviews.findUnique({
    where: {
      id,
    },
  });
  if (curReview.sender === req.token.username) {
    const deletedReview = await prisma.bazaar_reviews.delete({
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
