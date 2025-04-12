const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/items")
  .get(async (req, res) => {
    const items = await prisma.items.findMany();
    res.json(items);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    if (req.token.username === req.body.seller) {
      const data = req.body;
      console.log(data);
      const newItem = await prisma.items.create({
        data,
      });
      res.status(201).json({ message: "Item created successfully.", newItem });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to create items for other users!",
        },
      });
  });

router
  .route("/items/:id")
  .patch(checkAuthMiddleWare, async (req, res) => {
    const id = Number(req.params.id);
    const data = req.body;
    const curItem = await prisma.items.findUnique({
      where: {
        id,
      },
    });
    if (req.token.username === curItem.seller) {
      if (data.restock) {
        const updatedItem = await prisma.items.update({
          where: {
            id,
          },
          data: {
            quantity: {
              increment: data.quantity,
            },
          },
        });
        res.status(201).json({ message: "Item restocked successfully!", updatedItem });
      } else {
        const updatedItem = await prisma.items.update({
          where: {
            id,
          },
          data: {
            name: data.name,
            price: data.price,
            quantity: data.quantity,
            description: data.description,
          },
        });
        res.status(201).json({ message: "Item edited successfully!", updatedItem });
      }
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to update items for other users!",
        },
      });
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    const id = Number(req.params.id);
    const curUser = await prisma.users.findUnique({
      where: {
        username: req.token.username,
      },
    });
    const curItem = await prisma.items.findUnique({
      where: {
        id,
      },
    });
    if (curUser.username === req.token.username || req.token.admin) {
      if (curItem.type === "bid") {
        const curBid = await prisma.transactions.findFirst({
          where: {
            item: curItem.id,
          },
        });
        if (curBid) {
          const returnMoney = await prisma.users.update({
            where: {
              username: curBid.buyer,
            },
            data: {
              balance: {
                increment: curBid.total,
              },
            },
          });
          const deleteBid = await prisma.transactions.deleteMany({
            where: {
              item: curItem.id,
            },
          });
          const deletedItem = await prisma.items.delete({
            where: {
              id,
            },
          });
          return res
            .status(201)
            .json({ message: "Item deleted successfully!", deletedItem, returnMoney, deleteBid });
        }
      }
      const deletedItem = await prisma.items.delete({
        where: {
          id,
        },
      });
      res.status(201).json({ message: "Item deleted successfully!", deletedItem });
    } else {
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to delete items for other users!",
        },
      });
    }
  });

router
  .route("/transactions")
  .get(async (req, res) => {
    const transactions = await prisma.transactions.findMany();
    res.json(transactions);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const curItem = await prisma.items.findUnique({
      where: {
        id: data.item,
      },
    });
    const curUser = await prisma.users.findUnique({
      where: {
        username: req.token.username,
      },
    });
    if (
      (data.buyer === req.token.username &&
        data.buyer !== data.seller &&
        data.quantity <= curItem.quantity &&
        curUser.balance >= curItem.price * data.quantity) ||
      (data.seller === req.token.username && data.sell)
    ) {
      if (data.sell) {
        const moneyFromAuction = await prisma.users.update({
          where: {
            username: curItem.seller,
          },
          data: {
            balance: {
              increment: curItem.price,
            },
          },
        });
        const sellItem = await prisma.items.update({
          where: {
            id: data.item,
          },
          data: {
            quantity: 0,
          },
        });
        const buyingUser = await prisma.users.findUnique({
          where: {
            username: data.buyer,
          },
        });
        const wonAuctionMessage = await prisma.messages.create({
          data: {
            sender: buyingUser.username,
            recipient: buyingUser.username,
            message: `Congratulations, you won an auction for ${curItem.name} from ${curUser.firstName} ${curUser.lastName}! You can either pick it up on Chulak or you can message Teal'c to arrange delivery for an extra fee!`,
            system: true,
          },
        });
        res.status(201).json({
          message: "Item sold successfully!",
          moneyFromAuction,
          sellItem,
          wonAuctionMessage,
        });
      } else if (curItem.type === "bid") {
        const previousBid = await prisma.transactions.findFirst({
          where: {
            item: curItem.id,
          },
        });
        const updatedItem = await prisma.items.update({
          where: {
            id: data.item,
          },
          data: {
            price: data.total + 1000,
          },
        });
        const buyingUser = await prisma.users.update({
          where: {
            username: data.buyer,
          },
          data: {
            balance: {
              decrement: data.total,
            },
          },
        });
        if (previousBid) {
          const deletedBid = await prisma.transactions.deleteMany({
            where: {
              item: curItem.id,
            },
          });
          const newTransaction = await prisma.transactions.create({
            data: {
              buyer: data.buyer,
              seller: data.seller,
              item: data.item,
              quantity: data.quantity,
              total: data.total,
              type: data.type,
            },
          });
          const outbidUser = await prisma.users.update({
            where: {
              username: previousBid.buyer,
            },
            data: {
              balance: {
                increment: previousBid.total,
              },
            },
          });
          const systemMessage = await prisma.messages.create({
            data: {
              sender: outbidUser.username,
              recipient: outbidUser.username,
              message: `Auction for ${updatedItem.name}: you have been outbid by ${buyingUser.firstName} ${buyingUser.lastName}. ${previousBid.total} was returned to your account.`,
              system: true,
            },
          });
          return res.status(201).json({
            message: "Bid successful!",
            newTransaction,
            updatedItem,
            buyingUser,
            deletedBid,
            outbidUser,
            systemMessage,
          });
        }
        const newTransaction = await prisma.transactions.create({
          data: {
            buyer: data.buyer,
            seller: data.seller,
            item: data.item,
            quantity: data.quantity,
            total: data.total,
            type: data.type,
          },
        });
        res.status(201).json({
          message: "Bid successful!",
          newTransaction,
          updatedItem,
          buyingUser,
        });
      } else {
        const newTransaction = await prisma.transactions.create({
          data: {
            buyer: data.buyer,
            seller: data.seller,
            item: data.item,
            quantity: data.quantity,
            total: data.total,
            type: data.type,
          },
        });
        const updatedItem = await prisma.items.update({
          where: {
            id: data.item,
          },
          data: {
            quantity: {
              decrement: data.quantity,
            },
          },
        });
        const buyingUser = await prisma.users.update({
          where: {
            username: data.buyer,
          },
          data: {
            balance: {
              decrement: data.total,
            },
          },
        });
        const sellingUser = await prisma.users.update({
          where: {
            username: data.seller,
          },
          data: {
            balance: {
              increment: data.total,
            },
          },
        });
        const profitMessage = await prisma.messages.create({
          data: {
            sender: sellingUser.username,
            recipient: sellingUser.username,
            message: `${updatedItem.name}: ${buyingUser.firstName} ${buyingUser.lastName} bought ${data.quantity} pcs. ${data.total} was added to your account.`,
            system: true,
          },
        });
        res.status(201).json({
          message: "Item purchased successfully!",
          newTransaction,
          updatedItem,
          buyingUser,
          sellingUser,
          profitMessage,
        });
      }
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to purchase items for other users!",
        },
      });
  });

module.exports = router;
