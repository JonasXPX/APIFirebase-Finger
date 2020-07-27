const { db } = require("..");
const express = require('express')
const app = express()

app.get('/api/cadastros/', async (req, res) => {
    const data = await db.ref("/registros/").once('value');
    res.send(data.val());
});
