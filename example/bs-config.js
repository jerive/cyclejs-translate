'use strict';

module.exports = {
  server: {
    middleware: {
      1: require('serve-static')('./public', {
        setHeaders: (res, path) => {
            path.endsWith('.json') && res.setHeader('Content-Type', 'application/json')
        }
      }),
    }
  }
};