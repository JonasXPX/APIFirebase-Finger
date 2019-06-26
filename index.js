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
    databaseURL: 'https://sistema-de-ponto-2591a.firebaseio.com/',
    projectId: "sistema-de-ponto-2591a"
});
const db = firebase.database();

var registrar = 0;

db.ref('/registrar').on('value', (data) => {
    registrar = data.val();
});

/*
* checado 26/jun/2019
*/
app.get('/api/registrar',(req, res) => res.send(JSON.stringify(registrar)));

//Listar todos os cadastros
app.get('/api/cadastros/', (req, res) => {
    db.ref("/registros/").once('value').then((data) => {
        console.log(`HTTP get ${req.path}: `, data.val());
        res.send(data.val());
    });
});



/*
 * Registrar um ID unico || Usado pelo Leitor biometrico durante o cadastro
 * checado 26/jun/2019
 */
app.post('/api/registrar/:id', (req, res) => {
    console.log("Recebido registro ID: " + req.params.id);
    db.ref('/registros/' + req.params.id + '/').update({
        digital: true
    });
    db.ref("/").update({
        registrar: parseInt(0)
    });
    res.send("cadastro ativado...");
});

/* 
* NOVO METODO DE REGISTRO 11-JUN-2019
* checado 26/jun/2019
*/
app.post('/api/registrar', (req, res) => {
    console.log(`HTTP post from ${req.path} body:`, req.body);

    db.ref('/registros').once('value').then(value => {

        res.setHeader('Content-Type', 'application/json');
        let data = {};
        let nextIdRegitro = 1;
        while(value.hasChild(`${nextIdRegitro}`))
            nextIdRegitro++;

        db.ref("/").update({ registrar: nextIdRegitro })
            .then(() => {
                data = {...data, id: nextIdRegitro, digital: false, ...req.body.cadastro};
                
                db.ref(`/registros/${nextIdRegitro}/`).update(data);
                res.send(JSON.stringify(data));
        });
    });
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
    db.ref("registros/" + req.params.id).once('value').then(data => {
        console.log("Bem vindo " + (!data.val().ra ? 'Prof. ' : '')  + data.val().username);
    });
    res.status(200).send("okay");
});

/*
    Abrir registro pela ID
*/
app.post('/api/abrircadastro/:id', (req, res) => {
    if(!req.params.id) return res.status(400).send("ID não foi definido");
    
    db.ref("/").update({
        registrar: parseInt(req.params.id)
    });
    res.status(200).send({
        resp: "Aguardando cadastro"
    });
});

/*
* checado 26/Jun/2019
*/
app.get('/api/getmensagem/:msgname', (req, res) => {
    if(!req.params.msgname) return res.status(400).send("id da mensagem é obrigatório");
    db.ref('mensagens/' + req.params.msgname).once('value').then(data => {
        console.log(`HTTP get ${req.path}: `,data.val());
        res.send(data.val());
    });
});

const port = 80;
app.listen(port, () => console.log("Listening on port", port));