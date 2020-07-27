const Joi = require("Joi");
const express = require('express');
const app = express();
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const serviceAccount = require("./resources/google-service-account.json");
require("firebase/database");

app.use(express.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

firebase.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID
});
export const db = firebase.database();

var registrar = 0;

db.ref('/registrar').on('value', (data) => {
    registrar = data.val();
});


/*
    Quando um usuario acessa o laboratorio com a digital
    checado 26/jun/2019
*/
app.post('/api/senddata/:id', (req, res) => {
    if(!req.params.id) return res.status(400).send("ID não foi definido");

    const time = new Date().getTime();
    db.ref("log/" + time).set({
        timestamp: time,
        id: req.params.id
    });
    
    const data = await db.ref("registros/" + req.params.id).once('value')
    
    console.log("Bem vindo " + (!data.val().ra ? 'Prof. ' : '')  + data.val().username);

    res.status(200).send("okay");
});

/*
    Abrir registro pela ID
*/
app.post('/api/abrircadastro/:id', (req, res) => {
    if(!req.params.id) return res.status(400).send("ID não foi definido");
    
    await db.ref("/").update({ registrar: parseInt(req.params.id) });
    res.status(200).send({ responce: "Aguardando cadastro" });
});

/*
* checado 26/Jun/2019
*/
app.get('/api/getmensagem/:msgname', async (req, res) => {
    if(!req.params.msgname) return res.status(400).send("id da mensagem é obrigatório");

    const data = await db.ref('mensagens/' + req.params.msgname).once('value')
    res.send(data.val());
});

const port = 80;
app.listen(port, () => console.log("Listening on port", port));