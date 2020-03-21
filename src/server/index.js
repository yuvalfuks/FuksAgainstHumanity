const express = require('express')
const path = require('path')
const useragent = require('express-useragent');

const app = express()

app.get('/', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    if (!ua.isChrome) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("i only support chrome :)");
        return
    }
    res.sendFile(path.join(__dirname + '/../client/htmls/index.html'))
})

app.get('/browser', async (req, res) => {
    const source = req.headers['user-agent'],
    ua = useragent.parse(source);
    if (ua.isChrome) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("browser is supported!");
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(JSON.stringify(ua));
    }
})

app.post('/login', async (req, res) => {

})

app.listen(80, () => console.log(`listening on port 80!`))