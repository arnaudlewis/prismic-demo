const Prismic = require('prismic-javascript');
const { RichText, Link } = require('prismic-dom');
const app = require('./config');
const config = require('./prismic-configuration');
const PORT = app.get('port');
const Cookies = require('cookies');

app.listen(PORT, () => {
  console.log(`Go to browser: http://localhost:${PORT}`);
});

//Middleware catch all request, query Prismic API and configure everything for it
app.use((req, res, next) => {
  //init prismic context
  res.locals.ctx = {
    endpoint: config.apiEndpoint,
    linkResolver: config.linkResolver
  };
  //put RichText Helper from Prismic DOM to simplify convert RichText from json to html
  res.locals.RichText = RichText;
  //put Link helper from Prismic DOM to simplify getting url from link
  res.locals.Link = Link;

  Prismic.api(config.apiEndpoint, {
    accessToken: config.accessToken,
    req
  })
  .then((api) => {
    req.prismic = { api };
    //continue spreading request
    next();
  })
  .catch((error) => {
    //next with params handle error natively in express
    next(error.message);
  });
});

//Middleware that query menu in prismic for each GET request
app.use((req, res, next) => {
  req.prismic.api.getSingle("menu")
  .then((menu) => {
    res.locals.menu = menu;
    next();
  })
  .catch((err) => {
    next(`Error getting menu from prismic: ${error.message}`);
  });
});

// Route for the homepage
app.get('/', (req, res, next) => {
  req.prismic.api.getSingle("homepage")
  .then((home) => {
    res.render('homepage', { home });
  })
  .catch((error) => {
    next(`error when retriving homepage ${error.message}`);
  });
});

// Route for pages
app.get('/page/:uid', (req, res, next) => {
  const uid = req.params.uid;
  
  req.prismic.api.getByUID("page", uid)
  .then((page) => {
    res.render('page', { page });
  })
  .catch((error) => {
    next(`error when retriving page ${error.message}`);
  });
});

//preview
app.get('/preview', (req, res) => {
  const token = req.query.token;
  if (token) {
    req.prismic.api.previewSession(token, config.linkResolver, '/')
    .then((url) => {
      const cookies = new Cookies(req, res);
      cookies.set(Prismic.previewCookie, token, { maxAge: 30 * 60 * 1000, path: '/', httpOnly: false });
      res.redirect(302, url);
    }).catch((err) => {
      res.status(500).send(`Error 500 in preview: ${err.message}`);
    });
  } else {
    res.send(400, 'Missing token from querystring');
  }
});

