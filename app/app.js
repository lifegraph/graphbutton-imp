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

// Global user.
var globalUser;

// The oauth middleware intercepts the callback url that we set when we
// created the oauth middleware.
var oauth = rem.oauth(fb, 'http://' + app.get('host') + '/oauth/callback/');
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  globalUser = oauth.session(req);
  res.redirect('/');
}));
// Login URL calls oauth.startSession, which redirects to an oauth URL.
app.get('/login/', function (req, res) {
  oauth.startSession(req, {
    scope: ['publish_actions']
  }, function (url) {
    res.redirect(url);
  });
});
// Logout URL clears the user's session.
app.get('/logout/', function (req, res) {
  oauth.clearSession(req, function (url) {
    globalUser = null;
    res.redirect('/');
  });
});

/**
 * Routes
 */

app.get('/', function (req, res) {
  if (!globalUser) {
    res.setHeader('Content-Type', 'text/html');
    return res.send('<a href="/login/">Log in as the GraphButton user.</a>', 400);
  }

  globalUser('me').get(function (err, json) {
    res.setHeader('Content-Type', 'text/html');
    res.write('GraphButton Demo! The current acting Facebook user is <a href="https:/facebook.com/' + json.id + '">' + json.id + '</a>.');
    res.write('</pre>POST to /action to submit your action:');
    res.write('<form action="/action" method="post"><button>Post to Open Graph</button></form>')
    res.write('<a href="/logout/">Logout from GraphButton.</a>');
    res.end();
  })
});

app.post('/action', function (req, res) {
  if (!globalUser) {
    return res.send('No user logged in.', 400);
  }

  globalUser('me/' + process.env.FB_ACTION).post({
    button: "http://samples.ogp.me/439213929482825"
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
})

/**
 * Launch
 */

app.listen(app.get('port'), function () {
  console.log('Running on http://' + app.get('host'));
})