const express = require('express')
const path = require('path')
const useragent = require('express-useragent');

const app = express()
app.use('/client', express.static(__dirname + '/../client'))

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

app.post('/login', async (req, res) => {
    
})

app.listen(80, () => console.log(`listening on port 80!`))