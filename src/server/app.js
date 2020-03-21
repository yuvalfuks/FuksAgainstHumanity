const express = require('express')
const path = require('path')
const useragent = require('express-useragent');
const bodyParser = require('body-parser');

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

app.listen(80, () => console.log(`listening on port 80!`))