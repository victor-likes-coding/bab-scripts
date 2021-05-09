var config = {
  baseBet: { value: 1000, type: "balance", label: "base bet" },
  payout: { value: 2, type: "multiplier" },
  stop: { value: 4, type: "text", label: "Reset counter after wins:" },
  loss: {
    value: "increase",
    type: "radio",
    label: "On Loss",
    options: {
      base: { type: "noop", label: "Return to base bet" },
      increase: { value: 1.5, type: "multiplier", label: "Increase bet by" },
    },
  },

  win: {
    value: "increase",
    type: "radio",
    label: "On Win",
    options: {
      base: { type: "noop", label: "Return to base bet" },
      increase: { value: 1.5, type: "multiplier", label: "Increase bet by" },
    },
  },
};
// not in use currently
const getRandomWaitingPeriod = (min = 0, max = 5) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const getNextBet = (bet, counter, multiplier) => {
  const nextBet = Math.floor((bet / 100) * Math.pow(multiplier, counter)) * 100;
  return nextBet <= 100 ? 100 : nextBet;
};

const getNextPayout = (nextBet, profit, payoutBase = 1) => {
  const requiredMultiplier = Number.parseFloat((profit / nextBet).toFixed(3));
  const requiredPayout = requiredMultiplier + payoutBase;
  return requiredPayout === payoutBase ? 1.5 : requiredPayout;
};

const narrate = (counter, payout, bet) => {
  log(`Counter: ${counter}`);
  log(`${counter > 0 ? "Won" : counter < 0 ? "Loss" : "Neutral"} #${Math.abs(
    counter
  )} games. 
  Bet: ${Math.floor(bet)}
  Payout: ${payout}
  Potential win: ${(Math.floor(bet) * (payout - 1)).toFixed(2)}`);
};

const reportLosses = () => {
  log(
    `Account Balance: ${userInfo.balance / 100} from ${
      startingBalance / 100
    }. We're currently short ${profit / 100}`
  );
};

const protectAgainstLoss = () => {
  log("We're losing");
  log(
    `Balance: ${userInfo.balance / 100} < startingBalance: ${
      startingBalance / 100
    }, ${userInfo.balance < startingBalance}`
  );
  if (userInfo.balance < startingBalance) {
    profit = startingBalance - userInfo.balance;
    // if at any point, we have less than we started, that's when the losing protection will come in to help
    if (counter <= 0) {
      log("Counter <= 0");
      if (counter < 0) {
        // less than zero means we are on losing streak
        log(`Counter is < 0 but not 0`);
        counter--;
      } else {
        // counter is 0 meaning we're at the start of script
        counter -= 1;
        log(
          `Counter is 0, we're seeing this because it's either the start of the game or the user has been in profit and just hit negative territory: ${counter} === -1`
        );
      }
      reportLosses();
    } else {
      // counter is greater than 0
      counter = 0;
    }
    if (lossLimit + 1 <= counter && counter < 0) {
      log(`${lossLimit + 1} <= ${counter} && ${counter} < 0`);
      // if we lost between -1 through -8
      log(`Our current bet before adjusting, ${currentBet / 100}`);
      currentBet = Math.floor(getNextBet(bet, counter, lossMultiplier)); // reduce payout with a negative counter
      log(`Current bet after adjustment, ${currentBet / 100}`);
    } else {
      log(`We're here because ${counter} < ${lossLimit + 1}`);
      const payoutStablizer = profit / 0.05 / 100;
      if (counter <= lossLimit) {
        log(`Our counter, ${counter} is <= ${lossLimit}`);
        // see if the counter can be easily divisible by ${lossLimit}
        const isDivisibleByLossLimit = counter % lossLimit === 0;
        if (isDivisibleByLossLimit) {
          // const multiplicationFactor = counter / lossLimit * -1; // this should evenly divide
          // log(`Multiplication Factor: ${multiplicationFactor}`);
          // currentBet = 100 * Math.floor(Math.round(multiplicationFactor * payoutStablizer));
          currentBet = 100 * payoutStablizer;
          log(
            `We've lost ${counter} times, time to make it less harder to win`
          );
        }
      }

      if (counter === 0) {
        log(
          `I don't think it's physically possible to get here anymore where currentBet will turn into ${bet}`
        );
        currentBet = bet;
        log(`I stand corrected, good thing it was accounted for`);
      }
    }
    payout =
      counter > 1
        ? 2
        : Number.parseFloat(getNextPayout(currentBet, profit).toPrecision(3));

    log(
      `Loss #${counter * -1}, requires payout of: ${payout}x with bet of ${
        roundBit(currentBet) / 100
      } to make back ${Math.floor(profit / 100)}`
    );
  } else {
    log(
      `Continue to play because profits >= 0 ${
        (userInfo.balance - startingBalance) / 100
      }`
    );
    counter = 0;
    currentBet = bet;
  }
};

let randomWaitingPeriod = getRandomWaitingPeriod(0, -1);
let currentBet = config.baseBet.value;
let counter = 0;
let profit = 0;
let ath = 0;
let payout = config.payout.value;
let startingBalance = userInfo.balance;
const bet = config.baseBet.value;
const winMultiplier = config.win.options.increase.value;
const lossMultiplier = config.loss.options.increase.value;
const stopAfterWins = config.stop.value;
const lossLimit = -2;

log(`Starting Balance: ${startingBalance / 100}`);

function onGameStarted() {
  narrate(counter, payout, currentBet / 100);

  if (currentBet < 100) {
    currentBet = 100;
  }
  log("Betting: " + roundBit(currentBet) / 100);
  engine.bet(roundBit(currentBet), payout);
}

function onGameEnded() {
  var lastGame = engine.history.first();

  // If we wagered, it means we played
  if (!lastGame.wager) {
    return;
  }

  // we won..
  if (lastGame.cashedAt) {
    log("We won?");
    if (userInfo.balance > startingBalance) {
      profit = userInfo.balance - startingBalance;
      if (profit > ath) {
        ath = profit;
        log(
          `NAHOMFD -- New Account High of Mother F***ing Day (Script use): ${
            (ath + startingBalance) / 100
          }`
        );
      }
    }

    if (payout != config.payout.value) {
      log(`Payout is not equal to ${config.payout.value}`);
      payout = config.payout.value;
      log(`Now it is, ${payout}`);
    }
    // increase counter only if we're winning and we're not short on profit
    if (counter >= 0 && Math.floor(profit/100) > 0) {
      log(`Counter: ${counter} is >= 0 and we're in profit: ${profit/100} > 0`);
      if (counter > 0) {
        log(
          `Counter > 0, but not 0, increasing from ${counter} to ${counter + 1}`
        );
        counter++;
      } else {
        // counter is 0 meaning we're at the start of the script
        counter = 1;
        log(
          `We must've won from losing, so counter should be 1: ${counter} === 1`
        );
      }

      log(`We won with ${currentBet / 100}`);
      currentBet = getNextBet(bet, counter, winMultiplier);
      log(`Next bet will be ${currentBet / 100}`);
    } else {
      // win from losing
      counter = 0;
      log(
        `We are still red, meaning we losing and counter should equal to 0: ${counter} === 0`
      );
      protectAgainstLoss();
    }

    if (counter >= stopAfterWins) {
      log(
        `Congratulations, you've won ${stopAfterWins} times.
        Resetting counter to 0, and current bet back down to the base bet`
      );
      counter = 0;
      currentBet = bet;
      payout = config.payout.value;
      if (profit === ath) {
        startingBalance = userInfo.balance;
        profit = 0;
        ath = 0;
      }
    }
  } else {
    // we lost the game here
    protectAgainstLoss();
  }
}

function roundBit(bet) {
  return Math.floor(bet / 100) * 100;
}

engine.on("GAME_STARTING", onGameStarted);
engine.once("GAME_STARTING", () => engine.on("GAME_ENDED", onGameEnded));
