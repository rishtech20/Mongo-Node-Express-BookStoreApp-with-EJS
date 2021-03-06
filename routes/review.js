var express = require('express');
var router = express.Router();
var Book = require('../models/book');
var Purchase = require('../models/purchase');
var Review = require('../models/review');

router.get('/', (req, res, next) =>{
    res.render('review');
})
router.get('/pending', async(req, res, next) =>{
    var id = req.session.userId;
    var setBook = new Set();
    //get list of books purchased by user
    try{
    var purchasesDone = await Purchase.find({buyer: id});
    console.log(purchasesDone);
    purchasesDone.forEach(purchase =>{
        purchase.books.forEach(book =>{
            setBook.add(''+book.item);
        })
        
    });
    
    //get all review posted by user
    var booksReviewPosted = [];
    var booksReviewPending = [];
    var arrSetBook = Array.from(setBook);
    var reviewsPosted = await Review.find({buyer: id});
    //get two arrays one for books whose review is posted one for whose not
    reviewsPosted.forEach(review =>{
        booksReviewPosted.push(''+review.book);
    });
    arrSetBook.forEach(book =>{
        if(!booksReviewPosted.includes(''+book))
            booksReviewPending.push(''+book);
    })
    
    
    //show all books whose reviews are pending
    var arrBooks = await Promise.all(
        booksReviewPending.map(async (elem) => {
          var book = await Book.findById(elem)
          return book;
        })
      );
    res.render('pendingReviews',{arrBooks});
    } catch(error) {
        return next(error);
    }
});

router.get('/posted', async(req, res, next) =>{
    var id = req.session.userId;
    var setBook = new Set();
    //get list of books purchased by user
    try{
        var purchasesDone = await Purchase.find({buyer: id});
        console.log(purchasesDone);
        purchasesDone.forEach(purchase =>{
            purchase.books.forEach(book =>{
                setBook.add(''+book.item);
            })
            
        });
        //get all review posted by user
        var booksReviewPosted = [];
        var booksReviewPending = [];
        var arrSetBook = Array.from(setBook);
        var reviewsPosted = await Review.find({buyer: id});
        //get two arrays one for books whose review is posted one for whose not
        reviewsPosted.forEach(review =>{
            booksReviewPosted.push(''+review.book);
        });
        arrSetBook.forEach(book =>{
            if(!booksReviewPosted.includes(''+book))
                booksReviewPending.push(''+book);
        });
        
        
        //show all books whose reviews are pending
        var arrBooks = await Promise.all(
            booksReviewPosted.map(async (elem) => {
            var book = await Book.findById(elem)
            return book;
            })
        );
        var reviews = await Promise.all(
            arrBooks.map(async (elem) =>{
                var review = await Review.findOne({
                    buyer: id, 
                    book: elem.id
                });
                return review;
            })
        );
        console.log(arrBooks);
        var ratings = arrBooks.map(book =>{
            var rate;
            book.ratings.forEach(rating =>{
                if(rating.buyer == id)
                    rate = rating.rating;
            })
            return rate;
        });
        arrBooks.forEach(book =>{
            var sum = 0;
            var cnt = 0;
            book.ratings.forEach(elem =>{
                sum += elem.rating;
                cnt++;
            })    
            if(cnt > 0 ) {
                book.isRated = true;
                book.averageRating = Math.round(sum/cnt);
            }
            else{
                book.isRated = false;
            }
        })
        res.render('postedReviews',{arrBooks, reviews, ratings });
    }catch(error) {
        return next(error);
    }
});

router.get('/:slug', async(req, res, next) =>{
    var slug = req.params.slug;
    var id = req.session.userId;
    
    try{
        var book = await Book.findOne({slug});
        console.log(book.title);
        res.render('addReview', {book}); 
    }
    catch(error){
        return next(error);
    }
});

router.post('/:slug', async(req, res, next) =>{
    console.log('HERE WEGO');
    var id = req.session.userId;
    var slug = req.params.slug;
    var rating = req.body.rate;
    try{
        var book = await Book.findOne({slug});
        req.body.book = book.id;
        req.body.buyer = id;
        var review = await Review.create(req.body);
        book = await Book.findOneAndUpdate({slug}, {$addToSet: {reviews: review.id}});
        book = await Book.findOneAndUpdate({slug}, {$addToSet: {ratings:{buyer: id, rating: rating}}});
        req.flash('success', `Review posted for Book ${book.title}`);   
        res.redirect('/review/pending');
    }
    catch(error){
        return next(error);
    }
});
router.get('/:slug/delete', async(req, res, next) =>{
    var id = req.session.userId;
    var slug = req.params.slug;
    try{
        var book = await Book.findOne({slug}); 
        var review = await Review.findOneAndRemove({book: book.id, buyer: id});
        book = await Book.findOneAndUpdate({slug}, {$pull:{reviews: review.id}});
        book = await Book.findOneAndUpdate({slug}, {$pull:{ratings: {buyer:id}}});
        req.flash('success', `Review deleted for Book ${book.title}`);  
        res.redirect('/review/posted');
    }
    catch(error){
        return next(error);
    }
});
module.exports = router;