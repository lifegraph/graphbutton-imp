var rem = require('rem')
  , express = require('express')
  , path = require('path');

/**
 * Create Application
 */

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000); // sets up the port
  app.set('host', process.env.HOST || ('localhost:' + app.get('port')));
  app.use(express.cookieParser());
  app.use(express.session({
    secret: "some arbitrary secret"
  }));
  app.use(express.favicon()); // default favicon
  app.use(express.logger('dev')); // error logging
  app.use(express.bodyParser()); // 
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public'))); // sets the path for public files (css & js)
})

/**
 * Facebook API
 */

var fb = rem.connect('facebook.com', '1.0').configure({
  key: process.env.FB_KEY,
  secret: process.env.FB_SECRET
});

// User keys.
var keys = {}, globalUser;

var crypto = require('crypto');
var keyskey = 'im not actually a beggar, im actually a... magic man';

function hashId (id) {
  return crypto.createHmac('sha1', keyskey).update(id).digest('hex');
}

// The oauth middleware intercepts the callback url that we set when we
// created the oauth middleware.
var oauth = rem.oauth(fb, 'http://' + app.get('host') + '/oauth/callback/');
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  var user = oauth.session(req);
  user('me').get(function (err, json) {
    user.saveState(function (state) {
      if (err || !json.id) {
        res.redirect('/error');
      }

      keys[hashId(json.id)] = state;
      res.redirect('/');
    })
  });
}));
// Login URL calls oauth.startSession, which redirects to an oauth URL.
app.get('/login/', oauth.login({
  scope: ['publish_actions']
}));
// Logout URL clears the user's session.
app.get('/logout/', function (req, res, next) {
  var user = oauth.session(req);
  if (!user) {
    return next();
  }

  user('me').get(function (err, json) {
    if (json && json.id) {
      delete keys[hashId(json.id)];
    }
    next();
  })
}, oauth.logout(function (req, res) {
  res.redirect('/');
}));


/**
 * Routes
 */

app.get('/error', function (req, res) {
  res.send('There was an error logging into Facebook. Please retry.');
});

app.get('/', function (req, res) {
  var user = oauth.session(req);
  if (!user) {
    res.setHeader('Content-Type', 'text/html');
    return res.send('<a href="/login/">Log in to GraphButton.</a>', 400);
  }

  user('me').get(function (err, json) {
    var path = '/action/' + hashId(json.id);

    res.setHeader('Content-Type', 'text/html');
    res.write('<p>GraphButton Demo! The current acting Facebook user is <a href="https:/facebook.com/' + json.id + '">' + json.id + '</a>.</p>');
    res.write('<p>POST to ' + path + ' to submit your action:</p>');
    res.write('<form action="' + path + '" method="post"><button>Post to Open Graph</button></form>')
    res.write('<p><a href="/logout/">Logout from GraphButton.</a></p>');
    res.end();
  })
});

app.post('/action/:user', function (req, res) {
  if (!keys[req.params.user]) {
    return res.json({message: 'Invalid or expired id.'}, 400);
  }

  var user = oauth.restore(keys[req.params.user]);
  user.validate(function (valid) {
    if (!valid) {
      delete keys[req.param.user];
      oauth.clearSession(req);
      return res.json({message: 'Expired Facebook credentials. Please log in again.'}, 400);
    }

    user('me/' + process.env.FB_ACTION).post({
      button: process.env.FB_SAMPLE
    }, function (err, json) {
      res.setHeader('Content-Type', 'text/html');
      res.write('Response: <pre>');
      res.write(JSON.stringify(json, null, '\t'));
      res.write('</pre>');
      if (json.id) {
        var url = 'https://facebook.com/' + json.id;
        res.write('See action: <a href="' + url + '">' + url + '</a>');
      }
      res.end();
    });
  });
})

/**
 * Launch
 */

app.listen(app.get('port'), function () {
  console.log('Running on http://' + app.get('host'));
})