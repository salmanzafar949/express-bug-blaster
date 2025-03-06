const express = require('express');
const app = express();
const bugBlaster = require('../src/index')
app.use(express.json());
app.get('/posts', (req, res) => {
    return res.status(200).json({
        posts
    })
})

app.use(bugBlaster());

app.listen(3005, () => console.log('Listening on port 3005'));
