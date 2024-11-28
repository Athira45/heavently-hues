
const path = require('path');
const express = require('express');
const router=express();
const userController = require('../controller/userController')
const orderController = require('../controller/orderController');
const UserAuth = require("../middleware/userAuth");
const flash=require("express-flash");
const passport = require('../config/passport');
const productController = require('../controller/productController');
const cartController = require('../controller/cartController');
const wishlistController = require('../controller/wishlistController');
const walletController = require('../controller/walletController');


router.set('view engine','ejs');
router.set('views',path.join(__dirname,'../views/user'))

//load homepage
router.get('/',UserAuth.isBlock,userController.LoadIndex);

router.use(flash());

//signUp / register
router.get('/register',UserAuth.isLogout,userController.loadRegister);
router.post('/register',userController.insertUser);

//otp
router.post('/VerifyOtp',userController.verifyOtp);
router.post('/resend-Otp',userController.resendOtp)
// router.get('/VerifyOtp',userController.verifyOtp)



//login
router.get('/login',UserAuth.isLogin,userController.loginLoad)
router.post('/login',UserAuth.isBlock,userController.verifyLogin);

//google
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  //  console.log("goole user: ", req.user);
   req.session.userData = {
    name: req.user.name,
    email: req.user.email,
    googleId: req.user.googleId
  };
    res.redirect('/');
})


//forgotPassword

router.get('/forgotpassword',UserAuth.isLogout,userController.forgotpassward);
router.post('/forgotOTP',userController.forgotOtpPage);
router.get('/verifyForgotOtp',userController.FverifyOtp);
router.post('/resetpassword',userController.resetPage);



//------------------products--------------------------
router.get('/productDetails/:id',productController.renderProductDetails);
router.get('/products',productController.userProducts);
router.get('/filter',userController.filterResult);
router.get('/search',userController.searchResult);


//Logout
 router.get("/logout",userController.userLogout);


 //--------------------------------user Profile---------------------------------
 router.get('/profile',userController.userProfile);
 router.post('/edit-profile',userController.editProfile);
 //change password
 router.post('/changepassword',userController.changePassword);

 router.get("/addaddress",userController.loadaddAddress);
 router.post('/addAddressProfile',userController.addAddressProfile);
 router.post('/updateaddress/:id',userController.editAddress);
 router.post('/removeaddress/:id',userController.removeAddress);

//--------------------------------------cart------------------------------------
router.get('/cart',cartController.loadCartPage);
router.post('/addingcart/:productid/:quantity/:userid',cartController.addToCart);
router.get('/addtocart',cartController.addToCart);
router.post('/removeFromCart',cartController.removeCart);
router.post('/update-cart-quantity/:id',cartController.updateQuantity);
router.post('/decreaseQty/:id',cartController.DecreaseQty);

//--------------------------------------checkout----------------------------------
router.post('/saveCoupon',cartController.couponSave);
router.get("/checkout",cartController.loadCheckout);
router.get("/address",cartController.loadAddAddress);
router.post("/address",cartController.addAddress);

//order

 router.post('/placeorder',orderController.creatingorder);
 router.get('/ordersuccess',orderController.RenderSuccesPage);
 router.get('/orderdetails',orderController.orderDetailsPage);
//  router.post('/cancelOrder/:orderId/:productId',orderController.cancelOrPlaceOrder);
router.post('/cancelOrder/:orderId/:productId', orderController.cancelOrPlaceOrder);

 router.post('/returnOrder/:orderId/:productId',orderController.orderReturn);

 //dowload invoices
router.get("/dowload-invoice/:id",orderController.generateOrderInvoice);

 
//  router.post('/addAddressProfile',userController.addAddressProfile);

//-----------------------------WishList--------------------------------------
router.get("/wishlist",wishlistController.loadWishlist);
router.get("/addingWishlist/:productid",wishlistController.addToWishlist);
router.post("/addingWishlist/:productid",wishlistController.addToWishlist);
router.post('/removeFromWishlist',wishlistController.removeWishlist);
router.post("/addToCart/:productid",wishlistController.wishAddToCart);

//------------------------------------------Online Payment-------------------------------
router.get('/razor-key',orderController.getKey);
router.post('/razor-order',orderController.createRazerPayOrder);
// router.get('/order-failure', userAuth.isLogin, orderController.orderFailed);
router.post('/faildOrder',orderController.paymentFailure);
router.post('/retry-payment/:orderId',orderController.rePayment);




//--------------------wallet------------------------------------------------------------
router.get('/wallet',UserAuth.isLogin,walletController.loadWallet);


router.get('/500',userController.InternalServer);
router.get('/400',userController.userNotFound);

module.exports = router;