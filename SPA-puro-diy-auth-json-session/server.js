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
          role: 'user'
        },
        {
          user: 'Ismael',
          pass: '1234',
          role: 'admin'
        }],
      function (err, success) {
        if (err) throw err;

        console.log('Usuarios insertados correctamente');

        var app = express();

        app.use(express.static(__dirname + '/public'));
        app.use(express.static(__dirname + '/node_modules'));


        app.use(cookieParser());
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(bodyParser.json());

        var diyAuthConfObj = new diyAuthConf(db);
        var jsonAuth      = new diyAuth({
          login    : diyAuthConfObj.login,
          userTypes: diyAuthConfObj.userTypes,
          noAuth   : diyAuthConfObj.noAuth
        });
        app.use(jsonAuth.start());


        app.set('view engine', 'html');


        /******************************** ROUTING *****************************/
        app.get('/', function (req, res) {
          res.type('text/html');
          res.sendFile(path.join(__dirname, '/public/views/' + 'index.html'));
        });

        app.post('/login', function (req, res) {
          var user = req.body.username;
          var pass = req.body.password;
          jsonAuth.logger(req, res, user, pass, function (err, success) {
            if (err) {
              res.status('403');
              res.send(err);
            } else {
              res.status('200');
              res.send(success);
            }
          });
        });

        app.post('/logout', function (req, res) {
          req.diyAuth.logout(req, res, function (err, success) {
            res.status(200);
            res.type('text/plain');
            res.send(success);
          });
        });

        app.post('/authenticate', function (req, res) {
          req.diyAuth.isAuthenticated(req, req.body.url, function (err, success) {
            if (err || success === false) {
              res.status(403).send();
            } else {
              res.status(200).send();
            }
          });
        });

        app.post('/adminData', function (req, res) {

          var adminData = 'Confidential admin data';

          res.status(200);
          res.type('text/plain');
          res.send(adminData);
        });

        /*****************************FIN ROUTING *****************************/

        app.listen(3000, function () {
          console.log('Servidor escuchando en http://localhost:3000');
        });

      });
  });
});
