require('dotenv').load();

var express = require("express");
var multer = require("multer");
var mime = require('mime-types');
var path = require('path');
var mysql = require('mysql');
var AWS = require('aws-sdk');

AWS.config.update({accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET, region: process.env.AWS_REGION});

var bucket = new AWS.S3({params: {Bucket: 'freeman-files'}});

var db_config = {
  host     : process.env.DB_HOST,
  database : process.env.DB_DB,
  multipleStatements : true,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
};

function uploadToS3(file, destFileName, callback) {
  bucket
    .upload({
      ACL: 'public-read',
      Body: file.buffer,
      Key: destFileName.toString() + "." + mime.extension(file.mimetype),
      ContentType: file.mimetype // force download if it's accessed as a top location
    })
    .send(callback);
}

var getFiles = function(callback){
  var connection = mysql.createConnection(db_config);
  connection.connect();

  connection.query('SELECT * FROM `files`', function(err, rows, fields) {
    if (err) throw err;

    callback(rows);

    connection.end();
  });
}

var storeFile = function(data_object){
  var connection = mysql.createConnection(db_config);
  connection.connect();

  var query = "INSERT INTO `files` (`data`) VALUES (" + connection.escape(JSON.stringify(data_object)) + ");";

  connection.query(query, function(err, rows, fields) {
    if (err) throw err;

    connection.end();
  });
}

//for server storage

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads/')
//   },
//   filename: function (req, file, cb) {
//     console.log(file.fieldname);
//     cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
//   }
// });
//
var upload = multer({
  // storage: storage
});
var uploader = upload.array("file");

var app = express(); //starts up your app

app.use('/assets', express.static('public/assets'));

app.get("/", function(req,res){
  res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

app.get("/files", function(req,res){
  getFiles(function(rows){

    if(rows){
      res.send(JSON.stringify(rows))
    } else {
      res.send(null);
    }

    res.end();

  });
});

app.post("/upload", uploader, function(req,res){

  var pid = '10000' + parseInt(Math.random() * 10000000);

  uploadToS3(req.files[0], pid, function (err, data) {
    if (err) {
      console.error(err);
      return res.send(null).end();
    }

    var response_obj = {
      filename: req.files[0].originalname,
      mimetype: req.files[0].mimetype,
      url: data.Location
    };

    res.send(JSON.stringify(response_obj)).end();

    //async
    storeFile(response_obj);

  });
});

var port = process.env.PORT !== undefined ? process.env.PORT : null;

if(!port){
  console.log("ERROR: No port specified. Not gonna run.");
  return;
}

console.log("Attempting to listen on port " + port + "...");

app.listen(port);
