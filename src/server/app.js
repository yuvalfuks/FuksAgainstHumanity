"use strict ";
const express = require('express');
const path = require('path');
const useragent = require('express-useragent');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fsPromises = require('fs').promises;

const app = express();
app.use('/client', express.static(__dirname + '/../client'));
app.use(bodyParser.urlencoded({ extended: true }));

/*
TODO list:
- calls with 2 responses

- give people time to see who won (a nice animation maybe?)

- GUI design and colors

BUGS:
- sometimes players lose a card

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
})

app.get('/game', async(req, res) => {
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("i only support chrome :)");
        return;
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/game.html'));
})

// testing
app.get('/browser', async(req, res) => {
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(ua.isChrome ? "browser is supported!" : JSON.stringify(ua));
})

const Cards = {
    packs: [],
    calls: [],
    responses: []
};

function getCall() {
    return Cards.calls[Math.floor(Math.random() * Cards.calls.length)]
}

function getResponse() {
    return Cards.responses[Math.floor(Math.random() * Cards.responses.length)]
}

const Game = {
    users: [],
    cardCzar: 0,
    numReady: 0,
    playedCards: [],
    currentCard: undefined,
    inProgress: false,
};

app.post('/api/login', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    if (!user) {
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
    }
    res.end("ok");
})

app.post('/api/card', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    const card = user.cards.find(card => card.id === req.body.id);
    Game.playedCards.push({
        card: card,
        nickname: req.body.nickname
    });
    user.chosenCard = card
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.post('/api/winner', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    user.score += 1;
    Game.cardCzar = (Game.cardCzar + 1) % Game.users.length;
    for (const user of Game.users) {
        if (user.chosenCard) {
            for (const i in user.cards) {
                if (user.cards[i].id == user.chosenCard.id) {
                    user.cards = user.cards.splice(i, 1);
                    break;
                }
            }
            user.chosenCard = undefined;
            user.cards.push(getResponse());
        }
    }
    Game.playedCards = [];
    Game.currentCard = getCall();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.post('/api/ready', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname);
    user.ready = true;
    Game.numReady += 1;
    if (Game.numReady > 2 && Game.numReady === Game.users.length) {
        Game.currentCard = getCall();
        Game.inProgress = true;
        console.log(Cards);
        for (const u of Game.users) {
            for (let step = 0; step < 7; step++) {
                u.cards.push(getResponse());
            }
        }
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.get('/api/game', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Game));
})

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
})

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
})

app.get('/api/packs', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Cards.packs));
})

app.get('/admin/remove/:id', async(req, res) => {
    Game.users = Game.users.filter(user => user.nickname !== req.params.id);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.listen(80, async() => {
    // testing, but maybe do this always with some default pack?
    data = await fsPromises.readFile(__dirname + '/../../db/packs.txt')
    for (pack of data.toString().split('\n')) {
        try {
            await importPack(pack);
        } catch (error) {
            console.log(`error importing '${pack}'`)
        }
    }
    console.log(`listening on port 80!`);
})