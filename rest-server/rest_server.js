
var config = require('./config')

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.databasePath);

var express = require('express');
var restapi = express();
var cors = require('cors');
var url = require('url');
var _ = require('underscore')

restapi.use(cors());


restapi.get('/data', function(req, res){

      var numberOfLinks = req.query.numberOfLinks || 1000;
  
      var queryProducts = 'SELECT prodid, ' + 
                                 'prodlabel ' +
                          'FROM products ';

      var queryCountries = 'SELECT e.ecid AS id, ' +
                                 'e.eclabel AS country, ' +
                                 'MAX(p.totpop) AS population ' +
                          'FROM economy AS e ' +
                          'LEFT JOIN total_population AS p ' +
                          'ON e.ecid = p.cid ';

      // TODO: This is super unsafe and an open invitation for SQL injection!
      //       But there is no way to pass an array of values into query!
      var queryTrades = 'SELECT exporterId AS source, ' + 
                               'importerId AS target, ' + 
                               'tradeVal, ' + 
                               'year, ' +
                               'prodId ' +
                        'FROM trade_exports ';

      if (req.query.hasOwnProperty('products')) {
          queryProducts = queryProducts + 'WHERE prodid IN (' + JSON.parse(req.query.products).join() + ')';
      }

      if (req.query.hasOwnProperty('countries')) {
          queryCountries = queryCountries + 'WHERE e.ecid IN (' + JSON.parse(req.query.countries).join() + ') ';
      }

      queryCountries = queryCountries + 'GROUP BY id';

      if (req.query.hasOwnProperty('products') || req.query.hasOwnProperty('countries') || req.query.hasOwnProperty('years')) {
          queryTrades = queryTrades + 'WHERE ';

          var conditionsSubQuery = [];
          if (req.query.hasOwnProperty('products')) {
            conditionsSubQuery.push('prodId IN (' + JSON.parse(req.query.products).join() + ')');
          }
          if (req.query.hasOwnProperty('countries')) {
            conditionsSubQuery.push('source IN (' + JSON.parse(req.query.countries).join() + ')');
            conditionsSubQuery.push('target IN (' + JSON.parse(req.query.countries).join() + ')');
          }
          if (req.query.hasOwnProperty('years')) {
            conditionsSubQuery.push('year IN (' + JSON.parse(req.query.years).join() + ')');
          }

          queryTrades = queryTrades + conditionsSubQuery.join(' AND ');

      }

      queryTrades = queryTrades + ' LIMIT ?';

      db.all(queryCountries, function(err, rowsCountries){

        db.all(queryTrades, numberOfLinks, function(err, rowsTrades) {

          db.all(queryProducts, function(err, rowsProducts) {

            var links = [];
            rowsTrades.forEach(function(e) {
                var sourceNode = rowsCountries.filter(function(n) {
                    return n.id === e.source;
                })[0],
                    targetNode = rowsCountries.filter(function(n) {
                        return n.id === e.target;
                    })[0];

                links.push({
                    source: rowsCountries.map(function(c){return c.id;}).indexOf(e.source),
                    target: rowsCountries.map(function(c){return c.id;}).indexOf(e.target),
                    weight: e.tradeVal,
                    product: e.prodId,
                    year: e.year,
                    direction: 'export'
                    
                });
            });

            res.json({
                      'links': links,
                      'nodes': rowsCountries.map(function(c){return {'label': c.country, 'population': c.population}}),
                      'product': rowsProducts.map(function(p){return {'id': p.prodid, 'label': p.prodlabel}}),
                      'year': _.chain(links).pluck('year').uniq().value().map(function(x){return {'id': x}}),
                      'direction': [{'id': 'export'}]
                     });

          });

        });

    });

});


restapi.get('/datainfo', function(req, res){

      var queryCountries = 'SELECT ecid AS id, ' +
                                  'eclabel AS label ' +
                          'FROM economy';
      var queryProducts = 'SELECT prodid AS id, ' + 
                                 'prodlabel AS label ' +
                          'FROM products ';

      db.all(queryCountries, function(err, rowsCountries) {

          db.all(queryProducts, function(err, rowsProducts) {

            var years = ["1995","1996","1997","1998","1999","2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012"];

            res.json({
                      'countries': rowsCountries,
                      'product': rowsProducts,
                      'year': years.map(function(d){ return {'id': d, 'label': d};}) 
                     });

          });

      });

});

restapi.listen(config.port,config.url);
console.log('Submit GET to ' + config.url + ':' + config.port + '/infodata');
console.log('Submit GET to ' + config.url + ':' + config.port + '/data');

