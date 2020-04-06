"use strict";
const express = require('express');
const path = require('path');
const useragent = require('express-useragent');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fsPromises = require('fs').promises;
const shuffle = require('shuffle-array')

const app = express();
app.use('/client', express.static(__dirname + '/../client'));
app.use(bodyParser.urlencoded({ extended: true }));

/*
- remember to uncomment 'res.end("dup");' in /api/login !!!!!!!

TODO list:
- better colors in game page
- in the menu where you choose packs, the text in the button is not centered

- the dot on the cards is on the weong side

- game leader can end the game
- calls with 2 responses

maybe:
- actually stash the packs in the db
*/

app.get('/', async(req, res) => {
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("i only support chrome :)");
        return;
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/home.html'));
});

app.get('/game', async(req, res) => {
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("i only support chrome :)");
        return;
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/game.html'));
});

// testing
app.get('/browser', async(req, res) => {
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(ua.isChrome ? "browser is supported!" : JSON.stringify(ua));
});

let Cards;

async function resetCards() {
    Cards = {
        packs: [],
        calls: [],
        currCalls: [],
        responses: [],
        currResponses: []
    };
    const data = await fsPromises.readFile(__dirname + '/../../db/packs.txt')
    const promises = [];
    for (const pack of data.toString().split('\n')) {
        promises.push(importPack(pack));
    }
    await Promise.all(promises);
}

function getCall() {
    if (Cards.currCalls.length == 0) {
        Cards.currCalls = Cards.calls.slice();
        shuffle(Cards.currCalls);
    }
    return Cards.currCalls.pop();
}

function getResponse(user) {
    if (Cards.currResponses.length == 0) {
        Cards.currResponses = Cards.responses.slice();
        shuffle(Cards.currResponses);
    }
    const newCard = Cards.currResponses.pop();
    if (user.cards.find(card => card.id == newCard.id)) {
        return getResponse(user);
    }
    return newCard;
}

let Game;

function resetGame() {
    Game = {
        users: [],
        cardCzar: 0,
        numReady: 0,
        playedCards: [],
        currentCard: undefined,
        inProgress: false,
        recentWinner: '',
        winner: '',
    }
}

app.post('/api/login', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    if (user) {
        // res.end("dup");
        // for testing, so i can switch between users.
        res.end("ok");
    } else {
        if (Game.inProgress) {
            res.end("bad");
            return;
        }
        const newUser = {
            nickname: req.body.nickname,
            ready: false,
            chosenCard: undefined,
            score: 0,
            cards: []
        }
        Game.users.push(newUser);
        res.end("ok");
    }
});

app.post('/api/card', async(req, res) => {
    const AlreadyPlayed = Game.playedCards.find(play => play.nickname === req.body.nickname);
    if (!AlreadyPlayed) {
        const user = Game.users.find(user => user.nickname === req.body.nickname);
        const card = user.cards.find(card => card.id === req.body.id);
        Game.playedCards.push({
            card: card,
            nickname: req.body.nickname
        });

        if (Game.playedCards.length == Game.users.length - 1) {
            shuffle(Game.playedCards);
        }

        user.chosenCard = card
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

app.post('/api/winner', async(req, res) => {
    if (Game.recentWinner == '' && Game.playedCards.length >= Game.users.length - 1) {
        const user = Game.users.find(user => user.nickname === req.body.nickname);
        user.score += 1;
        Game.recentWinner = user.nickname;
    
        setTimeout(() => {
            if (user.score == 10) {
                Game.winner = user.nickname;
                setTimeout(() => {
                    resetCards();
                    resetGame();
                }, 10000)
                return;
            }
            Game.cardCzar = (Game.cardCzar + 1) % Game.users.length;
            for (const user of Game.users) {
                if (user.chosenCard) {
                    for (const i in user.cards) {
                        if (user.cards[i].id == user.chosenCard.id) {
                            user.cards.splice(i, 1);
                            break;
                        }
                    }
                    user.chosenCard = undefined;
                    user.cards.push(getResponse(user));
                }
            }
            Game.recentWinner = '';
            Game.playedCards = [];
            Game.currentCard = getCall();
        }, 5000);
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

app.post('/api/ready', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    if (user && !user.ready) {
        user.ready = true;
        Game.numReady += 1;
        if (Game.numReady > 2 && Game.numReady === Game.users.length) {
            Game.currentCard = getCall();
            Game.inProgress = true;
            for (const u of Game.users) {
                for (let step = 0; step < 9; step++) {
                    u.cards.push(getResponse(u));
                }
            }
        }
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

app.get('/api/game/:id', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.params.id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (user) {
        res.end(JSON.stringify(Game));
    } else {
        res.end(JSON.stringify({users: 'bad'}));
    }
});

async function importPack(code) {
    let newPack = await fetch(`https://api.cardcastgame.com/v1/decks/${code}`);
    newPack = await newPack.json()
    if (newPack.id == "not_found") {
        throw new Error('pack not found');
    }
    Cards.packs.push(newPack);
}

async function addPackToGame(code) {
    let newResponses = await fetch(`https://api.cardcastgame.com/v1/decks/${code}/responses`);
    newResponses = await newResponses.json();

    let newCalls = await fetch(`https://api.cardcastgame.com/v1/decks/${code}/calls`);
    newCalls = await newCalls.json();
    newCalls = newCalls.filter(call => call.text.length < 3);

    if ((newResponses.length == 1 && newResponses[0].id == "not_found") ||
        (newCalls.length == 1 && newCalls[0].id == "not_found")) {
        throw new Error('pack not found');
    }

    Cards.calls = Cards.calls.concat(newCalls);
    Cards.responses = Cards.responses.concat(newResponses);
}

app.post('/api/pack/:id', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    try {
        await addPackToGame(req.params.id);
        res.end("ok");
    } catch (error) {
        console.log(error);
        res.end("bad");
    }
});

app.get('/api/pack/:id', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    try {
        if (Cards.packs.find(pack => pack.code == req.params.id)) {
            res.end("dup");
            return;
        }
        await importPack(req.params.id);
        await fsPromises.appendFile(__dirname + '/../../db/packs.txt', '\n' + req.params.id);
        res.end("ok");
    } catch (error) {
        console.log(error);
        res.end("bad");
    }
});

app.get('/api/packs', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Cards.packs));
});

app.get('/admin/remove/:id', async(req, res) => {
    Game.users = Game.users.filter(user => user.nickname !== req.params.id);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

// for memes :3
app.get('/admin/removePoint/:id/', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const user = Game.users.find(user => user.nickname == req.params.id);
    if (user) {
        user.score -= 1;
        console.log(`A point was removed from ${req.params.id}`)
        res.end("ok");
    }
    else {
        res.end("no such user");
    }
});

app.get('/admin/addPoint/:id/', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const user = Game.users.find(user => user.nickname == req.params.id);
    if (user) {
        user.score += 1;
        console.log(`A point was added to ${req.params.id}`)
        res.end("ok");
    }
    else {
        res.end("no such user");
    }
});

resetCards();
resetGame();
app.listen(80, () => {
    console.log(`listening on port 80!`);
});