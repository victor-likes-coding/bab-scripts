var config = {
    baseBet: { value: 1000, type: 'balance', label: 'base bet' },
    payout: { value: 2, type: 'multiplier' },
    streakLimit: { value: 10, type: 'text', label: 'Streak Limit' },
};

const startingBalance = userInfo.balance;
let baseBet = config.baseBet.value;
let bet = baseBet;
let payout = config.payout.value;
let streakLimit = config.streakLimit.value;
let streakCounter = 0;

function onGameStarted() {
    log(`Betting: ${roundBit(bet) / 100}, win streak: ${streakCounter}`);
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
        //  increase bet if we win
        bet = bet * 2;
        streakCounter++;
    } else {
        // we lost
        // set bet back to base bet
        bet = baseBet;
        streakCounter = 0;
    }

    if (streakCounter === streakLimit) {
        const endingBalance = userInfo.balance;
        const profit = endingBalance - startingBalance;
        stop(`We've hit our designated streak limit`);
        notify(`Some information:
      Balance started: ${startingBalance}
      Ending balance: ${endingBalance}
      Profit: ${profit}`);
    }
}

function roundBit(bet) {
    return Math.floor(bet / 100) * 100;
}

engine.on('GAME_STARTING', onGameStarted);
engine.once('GAME_STARTING', () => engine.on('GAME_ENDED', onGameEnded));
