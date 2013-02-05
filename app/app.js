var rem = require('rem')
  , express = require('express')
  , path = require('path');

/**
 * Create Application
 */

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000); // sets up the port
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

// The oauth middleware intercepts the callback url that we set when we
// created the oauth middleware.
var oauth = rem.oauth(fb, 'http://localhost:3000/oauth/callback/');
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  res.redirect('/');
}));
// Login URL calls oauth.startSession, which redirects to an oauth URL.
app.get('/login/', function (req, res) {
  oauth.startSession(req, function (url) {
    res.redirect(url);
  });
});
// Logout URL clears the user's session.
app.get('/logout/', function (req, res) {
  oauth.clearSession(req, function (url) {
    res.redirect('/');
  });
});
// Ensure the user is logged in at all times.
app.all('/*', function (req, res, next) {
  var user = oauth.session(req);
  if (!user) {
    res.redirect('/login/');
  } else {
    req.user = user;
    next();
  }
});

/**
 * Routes
 */

app.get('/', function (req, res) {
  req.user('me').get(function (err, json) {
    res.setHeader('Content-Type', 'text/html');
    res.write('GraphButton Demo! Your Facebook info: <pre>');
    res.write(JSON.stringify(json, null, '\t'));
    res.write('</pre>POST to /action to submit your action:');
    res.write('<form action="/action" method="post"><button>Post to Open Graph</button></form>')
    res.end();
  })
});

app.post('/action', function (req, res) {
  req.user('me').get(function (err, profile) {
    req.user('me/' + process.env.FB_ACTION).post({
      system: "http://samples.ogp.me/439213929482825"
    }, function (err, json) {
      res.setHeader('Content-Type', 'text/html');
      res.write('Response: <pre>');
      res.write(JSON.stringify(json, null, '\t'));
      res.write('</pre>');
      if (json.id) {
        var url = 'https://www.facebook.com/' + profile.id + '/activity/' + json.id;
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
  console.log('Running on http://localhost:' + app.get('port'));
})