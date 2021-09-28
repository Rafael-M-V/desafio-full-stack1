const express = require('express');
const bodyparser = require('body-parser');
const mysql = require('mysql');

const app = express();


var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '*****',
    database: 'db',
    multipleStatements: true
});

function check_for_user(data)
{
    con.connect(err =>{
        con.query("SELECT * FROM users WHERE BINARY (name=? OR email=?) AND passw=?",
        [data.user, data.user, data.passw],
        (err, result) => {
            exists = (result != undefined);
        });
    });
}


/* COISAS TEMPORARIAS QUE SERAO SUBSTITUIDAS DEPOIS */
var db = []; // temporary "data base" for users
var events = {} // temporary "data base" for events

db.push(
    {
        name: 'r',
        email: 'r@',
        passw: '123'
    }
);

events[{8:2021}] = [{
        dia: '9',
        descr: 'procissao',
        inicio: '14:30',
        termino: '15:30'
    }];

events[{8:2021}].push({dia:'1', descr:'vigilia', inicio:'00:00', termino:'05:00'});
events[{8:2021}].push({dia:'1', descr:'missa', inicio:'16:00', termino:'17:00'});
events[{8:2021}].push({dia:'1', descr:'missa', inicio:'13:00', termino:'14:00'});
events[{8:2021}].push({dia:'1', descr:'missa', inicio:'08:00', termino:'09:00'});

// funcao temporaria que verifica se usuario existe na 'base de dados'
function check_for_user_old(user_data)
{
    for(var i = 0; i < db.length; i++)
        if((db[i].name === user_data.user || db[i].email === user_data.user) &&
            db[i].passw === user_data.passw)

            return true;

    return false;
}

function getEvents(month, year)
{
    con.query("SELECT * FROM events WHERE mes=? AND ano=?",
    [month, year],
    (err, result) => {
        if(err)
            throw err;
        r = result;
    });
}


/*****************************************************/

function month_name(month)
{
    switch (month)
    {
        case 0: return "Janeiro";
        case 1: return "Fevereiro";
        case 2: return "Março";
        case 3: return "Abril";
        case 4: return "Maio";
        case 5: return "Junho";
        case 6: return "Julho";
        case 7: return "Agosto";
        case 8: return "Setembro";
        case 9: return "Outubro";
        case 10: return "Novembro";
        case 11: return "Dezembro";
        default: return "ERRO";
    }
}

function month_number(month)
{
    if(month === 'Janeiro') return '01';
    if(month === 'Fevereiro') return '02';
    if(month === 'Março') return '03';
    if(month === 'Abril') return '04';
    if(month === 'Maio') return '05';
    if(month === 'Junho') return '06';
    if(month === 'Julho') return '07';
    if(month === 'Agosto') return '08';
    if(month === 'Setembro') return '09';
    if(month === 'Outubro') return '10';
    if(month === 'Novembro') return '11';
    if(month === 'Dezembro') return '12';

    return '';
}



app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

app.set('view-engine', 'ejs');

/* GET */
app.get('/', (req, res) => {
    res.render('home.ejs');
    res.end();
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro.ejs');
    res.end();
});

app.get('/calendario', (req, res) => {
    res.end();
});


/* POST */

function set_month_day(m){
    if(m.length === 1)
        return '0' + m;
    return m;
}

app.post('/', (req, res) => {

    var user_data = {
        user: req.body.user,
        passw: req.body.passw
    };

    var date = {
        dia: set_month_day(new Date().getDate().toString()),
        mes: set_month_day(((new Date().getMonth())+1).toString()),
        ano: new Date().getFullYear().toString()
    };

    con.query("SELECT * FROM users WHERE BINARY (name=? OR email=?) AND passw=?;\
               SELECT * FROM events WHERE mes=? AND ano=?",
    [user_data.user, user_data.user, user_data.passw, date.mes, date.ano],
    (err, result) => {
        if(err)
            throw err;

        if(result[0].length != 0)
        {
            res.render('calendario.ejs',
            {
                data: JSON.stringify(result[1]),
                month: date.mes,
                year: date.ano,
                mname: month_name(parseInt(date.mes, 10)-1)
            });
        }
        else
        {
            res.redirect('/');
        }

        res.end();
    });
});

app.post('/cadastro', (req, res) => {
    var data = {
        name: req.body.name,
        email: req.body.email,
        passw: req.body.passw
    };

    con.connect((err) => {
        if(err)
            throw err;

        con.query("SELECT * FROM users WHERE BINARY email=?", [data.email], (err, result, fields) => {
            if(err)
                throw err;

            if(result.length === 0){
                con.query("INSERT INTO users (name, email, passw) VALUES(?,?,?)",
                [data.name, data.email, data.passw],
                (err, result) => {
                    if(err)
                        throw err;
                });
            }
        });

    });

    res.render('home.ejs');
    res.end();
});


app.post('/calendario', (req, res) => {

    var data = {
        descr: req.body.descr,
        dia: req.body.day,
        mes: month_number(req.body.month),
        ano: req.body.year,
        inicio: req.body.inicio_hora + ':' + req.body.inicio_minuto,
        termino: req.body.termino_hora + ':' + req.body.termino_minuto
    };

    console.log(req.body.acao);

    if(req.body.acao == 'Adicionar')
    {
        // adicionar evento na base de dados e dar refresh na pagina do usuario


        con.query("INSERT INTO events (descr, dia, mes, ano, inicio, termino) VALUES(?,?,?,?,?,?)",
        [data.descr, data.dia, data.mes, data.ano, data.inicio, data.termino],
        (err) => {
            if(err)
                throw err;
        });

    }
    else if(req.body.acao == 'Editar')
    {
        // to do
    }
    else if(req.body.acao == 'Remover')
    {
        con.query("DELETE FROM events WHERE descr=? AND dia=? AND mes=? AND ano=? AND inicio=? AND termino=?",
        [data.descr, data.dia, data.mes, data.ano, data.inicio, data.termino],
        (err) => {
            if(err)
                throw err;
        });
    }

    res.redirect('/');
    res.end();
});

app.listen(3000);
