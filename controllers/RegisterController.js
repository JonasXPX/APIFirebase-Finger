const { db } = require("..");
const express = require('express')
const api = express()

let registerIntentify = 0

api.get('/api/registrar', (req, res) => res.send(JSON.stringify(registerIntentify)))


/*
 * Registrar um ID unico || Usado pelo Leitor biometrico durante o cadastro
 * checado 26/jun/2019
 */
app.post('/api/registrar/:id', (req, res) => {

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
app.post('/api/registrar', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    const value = await db.ref('/registros').once('value')

    let data = {};
    let nextIdRegitro = 1;
    
    while(value.hasChild(`${nextIdRegitro}`))
        nextIdRegitro++;

    await db.ref("/").update({ registrar: nextIdRegitro })
    
    data = {...data, id: nextIdRegitro, digital: false, ...req.body.cadastro};

    await db.ref(`/registros/${nextIdRegitro}/`).update(data);
    res.send(JSON.stringify(data));
}); 