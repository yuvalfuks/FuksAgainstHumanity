const express = require('express')
const path = require('path')
const useragent = require('express-useragent');
const bodyParser = require('body-parser');
const fetch = require('node-fetch')

const app = express()
app.use('/client', express.static(__dirname + '/../client'))
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', async(req, res) => {
    const source = req.headers['user-agent']
    const ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/home.html'))
})

app.get('/game', async(req, res) => {
    const source = req.headers['user-agent']
    const ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/game.html'))
})

// testing
app.get('/browser', async(req, res) => {
    const source = req.headers['user-agent']
    const ua = useragent.parse(source);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(ua.isChrome ? "browser is supported!" : JSON.stringify(ua));
})

const Cards = {
    calls: [],
    responses: []
}

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
}

app.post('/login', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname)
    if (!user) {
        if (Game.inProgress) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("bad");
        }
        const newUser = {
            nickname: req.body.nickname,
            ready: false,
            chosenCard: undefined,
            score: 0,
            cards: []
        }
        for (let step = 0; step < 7; step++) {
            newUser.cards.push(getResponse())
        }
        Game.users.push(newUser)
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.post('/card', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname)
    const card = user.cards.find(card => card.id === req.body.id)
    Game.playedCards.push({
        card: card,
        nickname: req.body.nickname
    })
    user.chosenCard = card
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.post('/winner', async(req, res) => {
    const winner = Game.playedCards.find(play => play.card.id === req.body.id)
    const user = Game.users.find(user => user.nickname === winner.user)
    user.score += 1
    Game.cardCzar = (Game.cardCzar + 1) % Game.users.length
    for (const user of Game.users) {
        user.cards = user.cards.filter(card => card.id != user.choseCard.id)
        user.choseCard = undefined
        user.cards.push(getResponse())
    }
    Game.playedCards = []
    Game.currentCard = getCall()
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.post('/ready', async(req, res) => {
    const user = Game.users.find(user => user.nickname === req.body.nickname)
    user.ready = true
    Game.numReady += 1
    if (Game.numReady > 1 && Game.numReady === Game.users.length) {
        Game.currentCard = getCall()
        Game.inProgress = true
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.get('/users', async(req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Game));
})

app.post('/pack/:id', async(req, res) => {
    try {
        let newCalls = await fetch(`https://api.cardcastgame.com/v1/decks/${req.params.id}/calls`)
        newCalls = await newCalls.json()
        newCalls = newCalls.filter(call => call.text.length < 3)
        Cards.calls = Cards.calls.concat(newCalls)

        const newResponses = await fetch(`https://api.cardcastgame.com/v1/decks/${req.params.id}/responses`)
        Cards.responses = Cards.responses.concat(await newResponses.json())
    } catch (error) {
        console.log(error)
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end("error");
        return
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

// for memes
app.get('/admin/meme/:id', async(req, res) => {

    // this can be bypassed of course but if someone wants this so hard then im ok with it.
    if (req.connection.remoteAddress.toString() == "::1") {
        const user = Game.users.find(user => user.nickname === req.params.id)
        if (user) {
            user.score -= 1
        }
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.get('/admin/remove/:id', async(req, res) => {
    // this can be bypassed of course but if someone wants this so hard then im ok with it.
    if (req.connection.remoteAddress.toString() == "::1") {
        Game.users = Game.users.filter(user => user.nickname !== req.params.id)
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("ok");
})

app.listen(80, async() => {
    // testing, but maybe do this always with some default pack?
    let newCalls = await fetch(`https://api.cardcastgame.com/v1/decks/6QP6Y/calls`)
    newCalls = await newCalls.json()
    newCalls = newCalls.filter(call => call.text.length < 3)
    Cards.calls = Cards.calls.concat(newCalls)

    const newResponses = await fetch(`https://api.cardcastgame.com/v1/decks/6QP6Y/responses`)
    Cards.responses = Cards.responses.concat(await newResponses.json())

    // only when ready!!!!!
    Game.currentCard = getCall()

    console.log(Cards)
    console.log(`listening on port 80!`)
})