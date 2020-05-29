var express = require('express');
const mongoose = require("mongoose");
var router = express.Router();
var User = require('../models/user');
var Book = require('../models/book');
var Purchase = require('../models/purchase');
var Review = require('../models/review');
var auth = require('../middlewares/auth');

router.get('/', (req, res, next) =>{
    res.render('review');
})
router.get('/pending', async(req, res, next) =>{
    var id = req.session.userId;
    const setBook = new Set();
    //get list of books purchased by user
    var purchasesDone = await Purchase.find({buyer: id});
    console.log(purchasesDone);
    purchasesDone.forEach(purchase =>{
        purchase.books.forEach(book =>{
            setBook.add(book.item);
        })
        
    });
    console.log(setBook);
    //get all review posted by user
    var booksReviewPosted = [];
    var booksReviewPending = [];
    var arrSetBook = Array.from(setBook);
    var reviewsPosted = await Review.find({buyer: id});
    
    //get two arrays one for books whose review is posted one for whose not
    reviewsPosted.forEach(review =>{
        booksReviewPosted.push(review.book);
    });
    arrSetBook.forEach(book =>{
        if(!booksReviewPosted.includes(book))
            booksReviewPending.push(book);
    })
    console.log("Posted", booksReviewPosted);
    console.log("Pending", booksReviewPending);
    
    
    //show all books whose reviews are pending
    var arrBooks = await Promise.all(
        booksReviewPending.map(async (elem) => {
          var book = await Book.findById(elem)
          return book;
        })
      );
    console.log(arrBooks);
});

router.get('/posted', async(req, res, next) =>{

});
module.exports = router;