'use strict';

var MongoClient   = require('mongodb').MongoClient,
    express       = require('express'),
    path          = require('path'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bodyParser    = require('body-parser'),
    cookieParser  = require('cookie-parser'),
    session       = require('express-session');

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


        passport.use(new LocalStrategy(
          function (username, password, done) {
            // a esta función se le llamará cuando haya que autenticar un usuario

            coleccion.findOne({user: username}, function (err, user) {
              console.log(user);

              if (err) {
                return done(err);
              }

              if (!user) {
                return done(null, false, {message: 'Usuario incorrecto.'});
              }

              if (user.pass !== password) {
                return done(null, false, {message: 'Password incorrecta.'});
              }

              return done(null, user);
            });
          }
        ));

        passport.serializeUser(function (user, done) {
          console.log('serializeUser');
          console.log(user);
          done(null, user.id);
        });

        passport.deserializeUser(function (user, done) {
          console.log('deserializeUser');
          console.log(user);
          coleccion.find(user.id, function (err, user) {
            done(err, user);
          });
        });


        var app = express();

        app.use(express.static(__dirname + '/public'));
        app.use(express.static(__dirname + '/node_modules'));

        app.use(bodyParser.urlencoded({extended: false}));
        app.use(bodyParser.json());

        app.use(cookieParser());

        app.use(session({secret: '7 caballo tiene bonanza'}));

        app.use(passport.initialize());
        app.use(passport.session());


        app.set('view engine', 'html');


        /******************************** ROUTING *****************************/
        app.get('/', function (req, res) {
          res.type('text/html');
          res.sendFile(path.join(__dirname, '/public/views/' + 'index.html'));
        });

        app.post('/login', function (req, res, next) {
          passport.authenticate('local', function (err, user, info) {
            if (err) {
              return next(err);
            }

            var status, type, send;
            if (!user) {
              status = 401;
              type   = 'text/plain';
              send   = 'usuario o password incorrecto';
            } else {
              status = 200;
              type   = 'text/plain';
              send   = 'usuario logado correctamente';
            }

            res.status(status);
            res.type(type);
            res.send(send);

          })(req, res, next);
        });


        /*****************************FIN ROUTING *****************************/

        app.listen(3000, function () {
          console.log('Servidor escuchando en http://localhost:3000');
        });

      });
  });
});
