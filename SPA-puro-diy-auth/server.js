'use strict';

var MongoClient  = require('mongodb').MongoClient,
    express      = require('express'),
    path         = require('path'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    diyAuthConf  = require('./diy-auth-conf'),
    diyAuth      = require('./modules/diy-auth');

var url = 'mongodb://localhost:27017/spaAuthenticationExample';

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  console.log('Conectado correctamente al servidor');

  var coleccion = db.collection('spaPure');
  coleccion.deleteMany({}, function (err, success) {
    if (err) throw err;

    coleccion.insertMany([
        {
          user: 'Manolo',
          pass: '1234',
          type: 'user'
        },
        {
          user: 'Ismael',
          pass: '1234',
          type: 'admin'
        }],
      function (err, success) {
        if (err) throw err;

        console.log('Usuarios insertados correctamente');

        var app = express();

        app.use(express.static(__dirname + '/public'));
        app.use(express.static(__dirname + '/node_modules'));

        app.use(cookieParser());

        var diyAuthConfObj = new diyAuthConf(db);
        var diyAuthObj     = new diyAuth({
          findDbSession  : diyAuthConfObj.finDbdSession,
          login          : diyAuthConfObj.login,
          saveCookie     : diyAuthConfObj.saveCookie,
          saveSessionToDb: diyAuthConfObj.saveSessionToDb,
          userTypes      : diyAuthConfObj.userTypes,
          clearSessionDb : diyAuthConfObj.clearSessionDb
        });
        app.use(diyAuthObj.start());

        app.use(bodyParser.urlencoded({extended: false}));
        app.use(bodyParser.json());


        app.set('view engine', 'html');


        /******************************** ROUTING *****************************/
        app.get('/', function (req, res) {
          res.type('text/html');
          res.sendFile(path.join(__dirname, '/public/views/' + 'index.html'));
        });

        app.post('/login', function (req, res) {
          diyAuthObj.logger(req, res, function (err, req, res, message) {
            if (err) {
              res.status('403');
              res.send(err);
            } else {
              res.status('200');
              res.send(message);
            }
          });
        });

        app.post('/logout', function (req, res) {
          req.diyAuth.logout(req, res, function (err, done) {
            res.status(200);
            res.type('text/plain');
            res.send(done);
          });
        });

        app.post('/authenticate', function (req, res) {
          req.originalUrl = req.body.url;
          req.diyAuth.isAuthenticated(req, function (err, success) {
            if (err || success === false) {
              res.status(403).send();
            } else {
              res.status(200).send();
            }
          });
        });

        /*****************************FIN ROUTING *****************************/

        app.listen(3000, function () {
          console.log('Servidor escuchando en http://localhost:3000');
        });

      });
  });
});
