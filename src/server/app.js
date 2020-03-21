const express = require('express')
const path = require('path')
const useragent = require('express-useragent');
const bodyParser = require('body-parser');

const app = express()
app.use('/client', express.static(__dirname + '/../client'))
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/home.html'))
})

app.get('/game', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/game.html'))
})

// testing
app.get('/browser', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(ua.isChrome ? "browser is supported!" : JSON.stringify(ua));
})

function getBlackCard() {
    
}

const Game = {
    users : [],
    cardCzar : 0,
    numReady : 0,
    playedCards : [],
    currentCard : getBlackCard(),
    inProgress : false
}



app.post('/login', async (req, res) => {
    // todo: check for duplicate nicknames
    if (Game.inProgress) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("bad");
    }
    Game.users.push({ 
        nickname : req.body.nickname,
        ready : false,
        choseCard : false,
        score : 0,
    })
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.get('/card', async (req, res) => {
    
})

app.post('/card', async (req, res) => {
    user = Game.users.find(user => user.nickname == req.body.nickname)
    playedCards.push({
        text : req.body.text,
        user : user.nickname
    })
    user.choseCard = true
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.post('/winner', async (req, res) => {
    user = Game.users.find(user => user.nickname == req.body.nickname)
    user.score += 1
    cardCzar = (cardCzar + 1) % Game.users.length
    for(user of Game.users) {
        user.choseCard = false
    }
    Game.playedCards = []
    Game.currentCard = getBlackCard()
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.post('/ready', async (req, res) => {
    user = Game.users.find(user => user.nickname == req.body.nickname)
    user.ready = true
    Game.numReady += 1
    if (Game.numReady > 1 && Game.numReady == Game.users.length) {
        Game.inProgress = true
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.get('/users', async (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(Game));
})

app.listen(80, () => console.log(`listening on port 80!`))




