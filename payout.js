var config = {
  baseBet: { value: 100, type: "balance", label: "base bet" },
  payout: { value: 20, type: "multiplier" },
  loss: {value: 0, type: 'text', label: "Loss Count:"}
};

let baseBet = config.baseBet.value;
let basePayout = config.payout.value;
let bet = baseBet;
let payout = basePayout
let losses = config.loss.value;

function onGameStarted() {

  log(`Betting: ${roundBit(bet)/100}, losses: ${losses}`);
  engine.bet(roundBit(bet), payout);
}

function onGameEnded() {
  var lastGame = engine.history.first();

  // If we wagered, it means we played
  if (!lastGame.wager) {
    return;
  }

  // we won..
  if (lastGame.cashedAt) {
    // means we won
    payout = basePayout;
    losses = 0;
    bet = baseBet;
    log(`Reset payout to ${payout}`)

  } else {
    // we lost
    // increase losses
    losses++;

    // check if losses is half of our payout 
    if (losses >= payout / 2) {
      let factor = 2
      if (payout >= 1280) {
        bet++;
        factor = 1.5
        log(`Payout increasing from ${payout} by ${factor} to ${payout * factor}`)
        payout *= 1.5
      } else {
        log(`Payout increasing from ${payout} by ${factor} to ${payout * factor}`)
        payout *= 2
      }
    }
  }
}

function roundBit(bet) {
  return Math.floor(bet / 100) * 100;
}

engine.on("GAME_STARTING", onGameStarted);
engine.once("GAME_STARTING", () => engine.on("GAME_ENDED", onGameEnded));
