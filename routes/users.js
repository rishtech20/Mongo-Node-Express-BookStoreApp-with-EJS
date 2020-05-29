var express = require('express');
const mongoose = require("mongoose");
var router = express.Router();
var User = require('../models/user');
var Book = require('../models/book');
var Purchase = require('../models/purchase');
var auth = require('../middlewares/auth');
var nodemailer = require('nodemailer');
/* GET users listing. */
// var smtpTransport = nodemailer.createTransport("SMTP",{
//   service: "Gmail",
//   auth: {
//       user: "anshu.saurav@gmail.com",
//       pass: "sk01264#"
//   }
// });
var rand,mailOptions,host,link;

router.post('/register', async(req, res, next) =>{
  console.log('HEREEERE');
  console.log(req.body);
  let {email} = req.body;
  try{
    var user = await User.findOne({email},'-password');
    if (!user) {
      user = await User.create(req.body);
      
      res.redirect("/users/login");
    }
    return next("Email id already in use.");
  }
  catch(error) {
    return next(error);
  }

});

// get login

router.get("/login", (req, res) => {
  res.render("signup");
});

// verify login

router.post('/login', async(req, res, next) =>{
  let {email, password} = req.body;
  try{
    let user = await User.findOne({email}, '-password');
    if (!user) return next("enter a valid email ID");
    if (!user.verifyPassword(password)) return res.redirect("/users/login");
    if(user.isBlocked)  return res.redirect("/users/login");

    req.session.userId = user.id;
    req.session.user = user;
    res.redirect("/");
  }
  catch(error) {
    return next(err);
  }

});

router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/');
})


router.get('/wishlist', auth.isLoggedin, async(req, res, next) =>{
  var id = req.session.userId;
  try{
    var loggedInUser = await User.findById(id).populate('wishList');
    res.render('wishlist', {loggedInUser:loggedInUser});

  }
  catch(error) {
    return next(err);
  }
});

//Display cart with book details and total price on page
router.get('/cart', auth.isLoggedin, async(req, res, next) =>{
  var id = req.session.userId;
  
  try{
    var loggedInUser = await User.findById(id).populate('personalcart.item');
    loggedInUser.personalcart.forEach(elem=>{
      console.log(elem.item.title);
    });
    // var cart = await Promise.all(
    //   loggedInUser.personalcart.map(async (elem) => {
    //     var book = await Book.findById(elem.item);
    //     return book;
    //   })
    // );
    var totalPrice = 0;
    loggedInUser.personalcart.forEach((elem,index)=>{
      totalPrice += elem.item.price*elem.quantity;
    });
    res.render('personalCart', {loggedInUser, totalPrice});
  }
  catch(error) {
    return next(error);
  }
  
});
/**
 * checks out user with his/her current cart
 */
router.get('/checkout', auth.isLoggedin, async(req, res, next) =>{
  var id = req.session.userId;
  try{
    var loggedInUser = await User.findById(id).populate('personalcart.item');
    // console.log(loggedInUser);
    
    var cart = await Promise.all(
      loggedInUser.personalcart.map(async (elem) => {
        var book = await Book.findById(elem.item);
        return book;
      })
    );
    var totalPrice = 0;
    //Checks if its okay to proceed with order and calculates totalPrice
    loggedInUser.personalcart.forEach((elem,index)=>{
      if(cart[index].quantity <  elem.quantity) {
        //Cant proceed with order display flash
        res.redirect('/users/cart');
      }
      else{
        elem.item = cart[index];
        totalPrice += elem.item.price*elem.quantity;
      }
    });

    //Order ready to be processed remove from inventory
    var updateBooks = await Promise.all(
      loggedInUser.personalcart.map(async (elem) => {
        var book = await Book.findByIdAndUpdate(elem.item.id, {$inc:{quantity: -elem.quantity}});
        return book;
      })
    );
    // console.log(updateBooks);
    var purchase = await Purchase.create({
      books: loggedInUser.personalcart.map(elem => {
        return {
          item: elem.item, 
          quantity: elem.quantity
        };
      }), buyer: id, totalPrice: totalPrice
    });
    // console.log(loggedInUser.name);
    var updatedUser =  await User.findByIdAndUpdate(id, {$set: { personalcart: []}});
    // console.log(updatedUser);
    res.render('checkout', {loggedInUser, purchase});
  }
  catch(error) {
    return next(error);
  }

});
module.exports = router;