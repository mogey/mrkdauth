import express from "express";
import Blackjack from "../game/blackjack.js";
import { Player } from "../index.js";

const router = express.Router();

const games = new Map();

/**
 * Validates user session IDs, instantiates a game session and returns it for the user to store their ID
 */
router.get("/user", async (req, res) => {
  const id = req.headers.id ? req.headers.id : 1;

  console.log("API  | ID| " + id + " | validating");
  //Search for the ID in the database
  const searchedPlayer = await Player.findOne({ where: { id: id } });
  //check to see if we found anything
  if (searchedPlayer) {
    //check to see if its in our session map, if it is then return it
    if (games.has(searchedPlayer.id)) {
      res.json(games.get(searchedPlayer.id));
      console.log("API  | ID| " + searchedPlayer.id + " | validated.");
      return;
    } else {
      //if its not, make a new game and insert it
      const newGame = new Blackjack(
        searchedPlayer.money,
        searchedPlayer.id,
        searchedPlayer.betAmount,
        searchedPlayer.gameDeck.cards,
        searchedPlayer.playerHand.cards,
        searchedPlayer.dealerHand.cards,
        searchedPlayer.state
      );
      games.set(searchedPlayer.id, newGame);
      res.json(games.get(searchedPlayer.id));
      console.log("API  | ID| " + searchedPlayer.id + " | validated.");
      return;
    }
  }
  if (!searchedPlayer) {
    const newPlayer = Player.build({ money: 1000 });
    const newGame = new Blackjack(
      newPlayer.money,
      newPlayer.id,
      newPlayer.betAmount,
      newPlayer.gameDeck.cards,
      newPlayer.playerHand.cards,
      newPlayer.dealerHand.cards,
      newPlayer.state
    );
    games.set(newPlayer.id, newGame);
    res.json(games.get(newPlayer.id));
    await newPlayer.save();
    console.log("API  | ID| " + newPlayer.id + " | registered and saved.");
    return;
  }
});

/**
 * Returns game state based off of ID, instantiates session if it doesn't exist, saves game state to database on every call
 */
router.get("/game", async (req, res) => {
  const id = req.headers.id;
  if (!id) {
    res.redirect(302, "/api/user");
    return;
  }

  console.log(
    "API  | ID| " +
      id +
      " | requested game state, there are " +
      games.size +
      " sessions in memory."
  );
  if (games.has(id)) {
    res.json(games.get(id));
    //save the game
    const searchedPlayer = await Player.findOne({ where: { id: id } });
    if (searchedPlayer) {
      const game = games.get(searchedPlayer.id);
      searchedPlayer.money = game.playerCredits;
      searchedPlayer.betAmount = game.betAmount;
      searchedPlayer.gameDeck = game.gameDeck.cards;
      searchedPlayer.playerHand = game.playerHand.cards;
      searchedPlayer.dealerHand = game.dealerHand.cards;
      searchedPlayer.state = game.state;
      searchedPlayer.save();
      console.log("API  | ID| " + searchedPlayer.id + " | saved game.");
    }
    return;
  } else {
    const searchedPlayer = await Player.findOne({ where: { id: id } });
    if (searchedPlayer instanceof Player && searchedPlayer) {
      try {
        const newGame = new Blackjack(
          searchedPlayer.money,
          searchedPlayer.id,
          searchedPlayer.betAmount,
          searchedPlayer.gameDeck,
          searchedPlayer.playerHand,
          searchedPlayer.dealerHand,
          searchedPlayer.state
        );
        games.set(searchedPlayer.id, newGame);
        res.json(games.get(searchedPlayer.id));
        return;
      } catch (err) {
        searchedPlayer.money = searchedPlayer.money + searchedPlayer.betAmount;
        searchedPlayer.betAmount = 0;
        searchedPlayer.gameDeck = [];
        searchedPlayer.playerHand = [];
        searchedPlayer.dealerHand = [];
        searchedPlayer.state = "bet";
        searchedPlayer.save();

        const newGame = new Blackjack(
          searchedPlayer.money,
          searchedPlayer.id,
          searchedPlayer.betAmount,
          searchedPlayer.gameDeck,
          searchedPlayer.playerHand,
          searchedPlayer.dealerHand,
          searchedPlayer.state
        );
        console.error(
          "!!API  | ID| " +
            searchedPlayer.id +
            " |  reset game due to error ." +
            err
        );
        games.set(searchedPlayer.id, newGame);
        res.json(games.get(searchedPlayer.id));
        return;
      }
    }
  }
  res.json(games.get(id));
});

/**
 * Calls the initialize round function for the given ID's instance
 */
router.post("/newGame", async (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/game");
    return;
  }

  game.initRound();
  res.json(game);
});

/**
 * Calls the deal function for the given ID's instance
 */
router.post("/deal", (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/game");
    return;
  }

  game.deal();
  res.json(game);
});

/**
 * Calls the hit function for the given ID's instance
 */
router.post("/hit", (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/game");
    return;
  }

  game.hit();
  res.json(game);
});

/**
 * Calls the stand function for the given ID's instance
 */
router.post("/stand", (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/game");
    return;
  }

  game.stand();
  res.json(game);
});

/**
 * Calls the replenish function for the given ID's instance
 */
router.post("/replenish", (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/game");
    return;
  }

  if (game.playerCredits === 0) {
    game.replenish();
  }

  res.json(game);
});

/**
 * Calls the bet function for the given ID's instance. Takes amount as URL parameter
 */
router.post("/bet/:amount", (req, res) => {
  const id = req.headers.id;
  const game = games.get(id);

  if (!game) {
    res.redirect(302, "/api/user");
    return;
  }

  const betAmount = parseInt(req.params.amount) || undefined;
  if (betAmount) {
    if (game.playerCredits - betAmount >= 0) {
      game.bet(betAmount);
    }
    res.json(game);
  } else {
    res.json(game);
  }
});

export default router;
