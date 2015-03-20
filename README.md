# Multilayer network visualization

This is a visualization of multilayer networks using D3's force layout, Angular for making reusable MVC components, Node.js for a rest server that communicates with sqlite3 database, and some Bootstrat and jQuery for UI. 

For local testing you can run the visualization on [localhost:8000](http://localhost:8000) after running Python's built-in server:

```
python -m SimpleHTTPServer
```

There are many static network files available, also it's possible for user to upload their own files. In case you stored your data in a SQL database, you can use REST interface provided with the following Node.js app (if you don't have nodemon installed, use node):

```
nodemon rest_server.js
```

This visualization is [live](http://matijapiskorec.github.io/multilayer-network-visualization/) on [GitHub Pages](https://pages.github.com/). We try to manually keep master and gh-pages branches in synch.