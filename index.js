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


app.get('/api/registrar',(req, res) => {
    res.send(JSON.stringify(registrar));
});

//Listar todos os cadastros
app.get('/api/cadastros/', (req, res) => {
    db.ref("/registros/").once('value').then((data) => {
        console.log(data.val());
        res.send(data.val());
    });
});

app.get('/api/log/', (req, res) => {
    db.ref('/log').once('value').then((data) => {
        res.send(data.val());
    });
});

//Listar um cadastro especifico
app.get('/api/cadastros/:id', (req, res) => {
    db.ref("/registros/" + req.params.id).once('value').then((data) => {
        if(!data.val()) return res.status(404).send("Não encontrado");
        res.send(data.val());
    });
});

//Registrar um ID unico || Usado pelo Leitor biometrico durante o cadastro
app.post('/api/registrar/:id', (req, res) => {
    console.log("Recebido registro ID: " + req.params.id);
    db.ref('/registros/' + req.params.id + '/').update({
        id: req.params.id
    });
    db.ref("/").update({
        registrar: parseInt(0)
    });
    res.send("ok");
});

/*
    Registrar por ID unico
*/
app.post('/api/registrar/:id/:name/:ra/:aluno/:curso', (req, res) => {
    const { error } = validar(res.params);
    console.log(req.params);
    if(error) return res.status(400).send(error.details[0].message);
    if(!req.params.ra){
        req.params.ra = 0;
    }
   
    db.ref('/registros/' + req.params.id + '/').set({
        id: req.params.id,
        name: req.params.name,
        ra: req.params.ra,
        aluno: req.params.aluno === 'academico' ? true : false,
        curso: req.params.curso
    });
    
    res.send({
        complete: "okay",
        id: req.params.id
    });
});

/*
    Quando um usuario acessa o laboratorio com a digital
*/
app.post('/api/senddata/:id', (req, res) => {
    if(!req.params.id) return res.status(400).send("ID não foi definido");
    const time = new Date().getTime();
    db.ref("log/" + time).set({
        timestamp: time,
        id: req.params.id
    });
    db.ref("registros/" + req.params.id).once('value').then(data => {
        console.log("Bem vindo " + (data.val().ra == 0 ? 'Prof. ' : '')  + data.val().name);
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
    Atualização de cadastro
*/
app.put('/api/cadastro/:id', (req, res) => {
    if(!req.params.id) return res.status(400).send("ID é obrigatório");
    const { error } = validar(req.query);
    if(error) return res.status(400).send(error.details[0].message);
    console.log(req.query);
    let isAluno = (req.query.aluno === 'true' ? true : false);
    db.ref('/registros/' + req.params.id + "").update({
        ra: !isAluno ? null : req.query.RA,
        name: req.query.name,
        aluno: isAluno,
        curso: req.query.curso
    });
    res.send(req.query);
});

app.get('/api/getmensagem/:msgname', (req, res) => {
    if(!req.params.msgname) return res.status(400).send("id da mensagem é obrigatório");
    db.ref('mensagens/' + req.params.msgname).once('value').then(data => {
        console.log(data.val());
        res.send(data.val());
    });
});

const port = 80;
app.listen(port, () => console.log("Listening on port", port));


function validar(cadastro){    
    const schemaName = {
        name: Joi.string().min(5).required(),
        RA: Joi.optional(),
        aluno: Joi.optional(),
        curso: Joi.optional()
    };
    return Joi.validate(cadastro, schemaName);
}