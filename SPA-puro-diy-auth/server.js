'use strict';

var MongoClient  = require('mongodb').MongoClient,
    express      = require('express'),
    path         = require('path'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    diyAuthConf  = require('./diy-auth-conf'),
    diyAuth      = require('./diy-auth');

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
        var diyAuthObj     = new require('./diy-auth')({
          isAuthenticated: diyAuthConfObj.isAuthenticated,
          login          : diyAuthConfObj.login,
          saveCookie     : diyAuthConfObj.saveCookie,
          saveSessionToBd: diyAuthConfObj.saveSessionToBd
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

        app.post('/login', function (req, res, next) {
          res.cookie('miCoookie', 'a tope con la cookie', {
            maxAge  : 900000,
            httpOnly: true
          });

          diyAuthObj.login(req, res, function (err, req, res, doc) {
            if (err) throw err;

            console.log(doc);
            diyAuthObj.saveCookie(req, res, doc, function (err, req, doc, cookieStoreData) {
              if (err) throw err;

              diyAuthObj.saveSessionToBd(req, doc, cookieStoreData, function (err, req) {
                if (err) throw err;

                //si llegamos aqui estaría logueado
                req.diyAuth = {
                  Authenticated  : true,
                  hasPermission  : true,
                  isAuthenticated: diyAuthObj.isAuthenticated,
                  login          : diyAuthObj.login,
                  saveCookie     : diyAuthConfObj.saveCookie,
                  saveSessionToBd: diyAuthConfObj.saveSessionToBd
                };
              });
            });
          });
        });

        app.post('/logout', function (req, res, next) {
          res.status(200);
          res.type('text/plain');
          res.send('Usuario deslogueado correctamente');
        });

        /*****************************FIN ROUTING *****************************/

        app.listen(3000, function () {
          console.log('Servidor escuchando en http://localhost:3000');
        });

      });
  });
});
