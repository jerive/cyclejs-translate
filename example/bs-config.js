module.exports = {
  server: {
    middleware: {
      0: require('connect-history-api-fallback')(),
      1: require('serve-static')('./public', {
        setHeaders: (res, path) => {
            path.endsWith('.json') && res.setHeader('Content-Type', 'application/json')
        }
      }),
      2: require('compression')(),
    }
  }
};
