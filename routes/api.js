'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log("Database error : " + err);
        else {
          db.collection('books')
            .aggregate([
              {$match: {}},
              {$project: {_id: true, title: true, commentcount: {$size: "$comments"}}}
            ])
            .toArray((err, dbResponse) => {
              if(err) console.log("Database Reading error : " + err);
              res.json(dbResponse);
          }); 
        }
      })
    })
    
    .post(function (req, res){
      var title = req.body.title;
      if(!title || title === '') {
        return res.send('Invalid title');
      }
      
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log("Database error : " + err);
        else {
          db.collection('books')
            .insertOne({
              title: title,
              comments: []
            }, (err, dbObj) => {
              if(err) console.log("Database insert error : " + err);
              else res.json(dbObj);
          });
        }
      });
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log("Database error : " + err);
        else {
          db.collection('books')
            .delete({}, (err, dbRes) => {
              if(err) console.log("Database delete error : " + err);
              else res.send('complete delete successful');
          })
        }
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log("Database error : " + err);
        else {
          db.collection('books')
            .findOneById(ObjectId(bookid), (err, dbRes) => {
              if(err) console.log("Database read error : " + err);
              else {
                if(dbRes == null || dbRes.length == 0) res.send('no book exists');
                else res.json(dbRes);
              }
          });
        }
      });
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      try {
        bookid = ObjectId(bookid);
      }
      catch(err) {
        console.log('Invalid book id');
      }
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log('Database connection error');
        else {
          db.findOneByIdAndUpdate(bookid, {$push: {comments: comment}}, (err, dbRes) => {
            if(err) console.log('Error updating in DB');
            else {
              console.log(dbRes);
              res.json(dbRes.value);
            }
          });
        }
      });
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
    
      try {
        bookid = ObjectId(bookid);
      }
      catch(err) {
        console.log('Invalid book id');
      }
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if(err) console.log("Database error : " + err);
        else {
          db.collection('books')
            .findByIdAndDelete(bookid, (err, dbRes) => {
              if(err) console.log("Database delete error : " + err);
              else res.send('delete successful');
          })
        }
      });
    });
  
};
