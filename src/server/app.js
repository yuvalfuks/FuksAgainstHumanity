const express = require('express')
const path = require('path')
const useragent = require('express-useragent');
const bodyParser = require('body-parser');
const https = require('https');

const app = express()
app.use('/client', express.static(__dirname + '/../client'))
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
    console.log(req.connection.remoteAddress)
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/home.html'))
})

// testing
app.get('/browser', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(ua.isChrome ? "browser is supported!" : JSON.stringify(ua));
})

const users = []
let calls = []
let responses = []
let cardCzar = 0

app.post('/login', async (req, res) => {
    users.append(req.body.nickname)
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.get('/getCard', async (req, res) => {
    
})

app.post('/chooseCard', async (req, res) => {
    
})

app.post('/chooseWinner', async (req, res) => {
    
})

app.get('/getUsers', async (req, res) => {
    
})

app.get('/pack/:id', async (req, res) => {
    https.request({
        hostname: 'api.cardcastgame.com',
        port: 443,
        path: `/v1/decks/${req.params.id}/calls`,
        method: 'GET'
    }, resTemp => {
        resTemp.on('data', d => {
            calls = calls.concat(JSON.parse(d.toString('utf8')))
        })
    }).end()

    https.request({
        hostname: 'api.cardcastgame.com',
        port: 443,
        path: `/v1/decks/${req.params.id}/responses`,
        method: 'GET'
    }, resTemp => {
        resTemp.on('data', d => {
            responses = responses.concat(JSON.parse(d.toString('utf8')))
        })
    }).end()

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("ok");
})

app.listen(80, () => console.log(`listening on port 80!`))