const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const body_parser = require('body-parser');
const DB = require('./models/db.js');
const trial = require('./models/trials.js');

DB.connect(true); // true if in production
app.use(body_parser.json());
app.use(express.static(__dirname + '/public'));
app.use('/jsPsych', express.static(__dirname + "/jsPsych"));
app.set('views', __dirname + "/public");
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(session({
    saveUninitialized: true, 
    resave: true, 
    secret: 'secret',
    store: new MongoStore({ 
        url: DB.getURL(),
        autoReconnect: true,
        collection: 'sessions'
    })
}));

app.get('/', function(req, res) {
    res.render('experiment.html');
});

app.get('/results', function(req, res) {
     trial.find({}, function(err, data) {
        res.send(data);
     });
});

app.post('/user-data', function(req, res) {
    req.session.email = req.body.user;
    res.end();
});

app.post('/experiment-data', function(req, res) {
    trial.create({
        'subject': req.body[0].subject,
        'left_label_div': req.body[0].left_label_div,
        'right_label_div': req.body[0].right_label_div,
        'target_item': req.body[0].target_item,
        'rt': req.body[0].rt,
        'response': req.body[0].response,
        'correct': req.body[0].correct,
        'mouse_movement': req.body[0].mouse_movement 
    });
    res.end();
});

const server = app.listen(DB.getPort(), function() {
    console.log("Listening on port %d", server.address().port);
});
