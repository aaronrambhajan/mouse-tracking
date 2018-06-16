const mongoose = require('mongoose');

let _URL = 'mongodb://localhost/jspsych';
let _PORT = 3000;

function connect(production) {
    if (production) {
        _URL = process.env.CONNECTION;
        _PORT = process.env.PORT;
    } 
    
    mongoose.connect(_URL);
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'Connection Error!'));
    db.on('open', function dbCallback() {
        console.log('Database Opened!');
    });
}

function getPort() {
    return _PORT;
}

function getURL() {
    return _URL;
}

module.exports = {
   connect: connect,
   getPort: getPort,
   getURL: getURL
};
