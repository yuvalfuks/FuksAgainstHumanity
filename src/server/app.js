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

- game leader can end the game
- calls with 2 responses
    - see the order you clicked?
    - split into several cards
- resetCards fetches packs from the website again. there is no need for that i think.
- indicate whenever we are done with a deck
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
        if (pack.length > 0) {
            promises.push(importPack(pack));
        }
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
        // i assume there are actually enough unique cards for a hand.
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
        plays: [],
        currentCard: undefined,
        inProgress: false,
        recentWinner: '',
        winner: '',
    }
}

app.post('/api/login', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    if (user) {
        res.end("dup");
        // for testing, so i can switch between users.
        // res.end("ok");
    } else {
        if (Game.inProgress) {
            res.end("bad");
            return;
        }
        const newUser = {
            nickname: req.body.nickname,
            ready: false,
            chosenCards: [],
            score: 0,
            cards: []
        }
        Game.users.push(newUser);
        res.end("ok");
    }
});

app.post('/api/card', (req, res) => {
    const AlreadyPlayed = Game.plays.find(play => play.nickname === req.body.nickname);
    if (!AlreadyPlayed) {
        const user = Game.users.find(user => user.nickname === req.body.nickname);

        const cards = []
        for (let i = 0 ; i < Game.currentCard.text.length - 1; i++) {
            const card = user.cards.find(card => card.id === req.body.ids[i]);
            cards.push(card);
        }
        
        Game.plays.push({
            cards: cards,
            nickname: req.body.nickname
        });

        if (Game.plays.length == Game.users.length - 1) {
            shuffle(Game.plays);
        }

        user.chosenCards = cards
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

app.post('/api/winner', (req, res) => {
    if (Game.recentWinner == '' && Game.plays.length >= Game.users.length - 1) {
        const user = Game.users.find(user => user.nickname === req.body.nickname);
        user.score += 1;
        Game.recentWinner = user.nickname;
    
        setTimeout(() => {
            if (user.score == 10) {
                Game.winner = user.nickname;
                setTimeout(async () => {
                    await resetCards();
                    resetGame();
                }, 10000)
                return;
            }
            Game.cardCzar = (Game.cardCzar + 1) % Game.users.length;
            for (const user of Game.users) {
                if (user.chosenCards.length > 0) {
                    for(const chosenCard of user.chosenCards) {
                        for (const i in user.cards) {
                            if (chosenCard.id == user.cards[i].id) {
                                user.cards.splice(i, 1);
                                break;
                            }

                        }
                        user.cards.push(getResponse(user));
                    }
                    
                    user.chosenCards = [];
                }
            }
            Game.recentWinner = '';
            Game.plays = [];
            Game.currentCard = getCall();
        }, 5000);
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

app.post('/api/ready', (req, res) => {
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

app.get('/api/game/:id', (req, res) => {
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
    // newCalls = newCalls.filter(call => call.text.length <= 3);

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

app.get('/api/packs', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Cards.packs));
});

app.get('/admin/removeUser/:id', (req, res) => {
    Game.users = Game.users.filter(user => user.nickname !== req.params.id);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
});

// for memes :3
app.get('/admin/removePoint/:id/', (req, res) => {
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

app.get('/admin/addPoint/:id/', (req, res) => {
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

async function run() {
    try {
        await fsPromises.access("../../db");
    } catch (error) {
        await fsPromises.mkdir("../../db");
    }

    try {
        await fsPromises.access("../../db/packs.txt");
    } catch (error) {
        await fsPromises.writeFile("../../db/packs.txt");
    }
    

    await resetCards();
    resetGame();

    app.listen(80, () => {
        console.log(`listening on port 80!`);
    });
}

run();
