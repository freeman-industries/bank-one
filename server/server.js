var express = require("express");
var multer = require("multer");
var mime = require('mime-types');
var path = require('path');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
  }
})

var upload = multer({
  storage: storage
});

var app = express(); //starts up your app

app.get("/", function(req,res){
  res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

var uploader = upload.single("file");
app.post("/upload", uploader, function(req,res){
  res.send(req.file)
  res.end();
});


app.listen(8080);

console.log("Hello wrold");
