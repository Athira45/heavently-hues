
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const userOtpVerification = require('../models/otpModel');
const env = require("dotenv").config();
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const Product = require("../models/productModel");
const Cart = require('../models/cartModel');
const Orders = require('../models/orderModel');
const Products = require('../models/productModel');
const Wallet = require('../models/walletModel');






const LoadIndex = async(req,res)=>{
  try {
    const queryProduct = req.params.id;
    const user = req.session?.userData ? req.session?.userData : null
    const products = await Product.find();
    const checkCart = await Cart.findOne({ user});
    let alreadyCart = false;
    if(checkCart){
        alreadyCart = checkCart.products.some(product => product.productId.toString() === queryProduct);
    }
    

    res.render('home',{user,products,alreadyCart});
  } catch (error) {
    console.log("error in loadIndex:",error);
  }

}

//searchig..........


const searchResult = async (req, res) => {
  try {
   
    const user = req.session.user_id;
    const query = req.query.q;
    console.log("Search query:", query);
    const { categories, sortOption, page = 1 } = req.query;
    const limit = 9;
    const skip = (page - 1) * limit;

    // Build filterOptions object
    let filterOptions = { is_listed: "Listed" }; // Changed from isBlocked to is_listed

    if (query) {
      filterOptions.name = { $regex: new RegExp(query, 'i') }; // Changed from ProductName to name
    }
   
   
    const categoriesList = await Category.find({});

    // Define sorting logic
    let sort = {};
    if (sortOption === 'priceAsc') {
      sort.price = 1; // Changed from Price to price
    } else if (sortOption === 'priceDesc') {
      sort.price = -1; // Changed from Price to price
    }

    // Fetch products based on filterOptions and pagination
    const productList = await Products.find(filterOptions)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category');

    const totalProducts = await Products.countDocuments(filterOptions);
    const totalPages = Math.ceil(totalProducts / limit);

    console.log("Products found:", productList.length);
    console.log("Total products:", totalProducts);

    // Render the view or send JSON response
    res.render('products', {
      user, 
      productList,
      categories: categoriesList,
      totalPages,
      totalProducts: totalProducts,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error in searchResults', error);
    res.status(500).send('Server Error');
  }
};






const filterResult = async (req, res) => {
  try {
      console.log("enter into this filterResult");
      const user = req.session.user_id;
      const { categories, sortOption, page = 1 } = req.query; // Include page query
      const limit = 9;
      const skip = (page - 1) * limit;

      // Build the query object
      let query = {};
      if (categories) {
          query.category = { $in: Array.isArray(categories) ? categories : [categories] };
      }

      // Set the sort object
      let sort = {};
      if (sortOption === 'priceAsc') {
          sort.price = 1; // Sort price ascending (low to high)
      } else if (sortOption === 'priceDesc') {
          sort.price = -1; // Sort price descending (high to low)
      }

      // Execute the query with filters and sorting, and limit pagination
      const productList = await Products.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('category');

      // Get total products for pagination
      const totalProducts = await Products.countDocuments(query); // Count with filters
      const totalPages = Math.ceil(totalProducts / limit);
      
      // Fetch categories for the UI
      const categoriesList = await Category.find();

      // Render the products page with the filtered products
      res.render('products', {
          user,
          productList,
          categories: categoriesList,
          currentPage: parseInt(page), // Ensure currentPage is an integer
          totalPages: totalPages,
          totalProducts: totalProducts
      });
  } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('Internal Server Error');
  }
};





//forgot password


const forgotpassward = async(req,res)=>{
  try {
    const user = req.session.user_id;
    res.render("forgotPassword",{user})
  } catch (error) {
    res.redirect("/500");
  }
}

//enter otp forgot passwrd
const forgotOtpPage = async(req,res) => {
  try {
    const { email } = req.body;
    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.render('signup', { err: "User not found" });
    }
    const createOtp = generateOtp(email);

    // Send email
    const sentEmail = await sendOTPverificationEmail(email, createOtp);
    console.log("OTP:", createOtp);

    if (!sentEmail) {
      return res.json({ success: false, message: "Email error" });
    }

    req.session.userOtp = createOtp;
    req.session.userData = { email };
    console.log("Session user data:", req.session.userData);

    // Render OTP page with email and no error message
    res.render("forgotOtp", { email: req.session.userData.email, otpErr: null });
  } catch (error) {
    console.error("Error in forgot OTP function:", error);
    res.redirect('/500');
  }
}



//verify forgotpassword otp

const FverifyOtp = async (req, res) => {
  console.log("Entering FverifyOtp");

  try {
    const userId = req.session.user_id;
    const { OTP } = req.body;

    if (OTP === req.session.userOtp) {
      // OTP is correct
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const googleId = `${randomString}${timestamp}`;

      // Clear OTP session
      req.session.userOtp = null;

      return res.json({ success: true, redirectUrl: '/resetpassword' });
    } else {
      // OTP is incorrect
      res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.redirect("/500");
  }
}






//reset password page render
const resetPage = async (req, res) => {
  console.log("Entering resetPage function");
  try {
    // Check if the user is authorized for password reset using the session
    const { userData } = req.session;

    if (!userData) {
      return res.redirect('/forgotpassword'); // If no user session, redirect to forgot password page
    }

    // Render the reset password page with user data
    res.render('resetPassword', { email: userData.email });
    console.log("resetPassword view rendered successfully");
  } catch (error) {
    console.log("error from resetPage function:", error);
    res.redirect("/500");
  }
};


//reset password
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // Proceed with password update logic
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: req.session.userId }, { password: hashedPassword });

    res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};



//login page

const loginLoad = async (req,res)=>{
  try{
    let message
    res.render('login',{message});
  }catch(error){
     res.redirect('/500');
  }
}


//verify login
const verifyLogin = async(req,res)=>{
  // console.log("request is coming",req)
  try{
      const email = req.body.email;
      const password = req.body.password;
      const userData = await User.findOne({email});
      // console.log("userData :",userData);

      if(userData){

        const passwordMatch = await bcrypt.compare(password,userData.password);
        if(passwordMatch){
          if(userData.status === 'Active'){
              req.session.user_id = userData._id;
              req.session.userData = userData;
              // console.log("session Userr:",req.session.userData);
              return res.redirect('/');


          }else{
            req.flash('err','User have blocked');
            return res.render('login',{message:req.flash('err')})
            
          }
        }else{
          req.flash('err','Incorrect username and password');
          return res.render('login',{message: req.flash('err')})
        }
      }else{
        req.flash('err','please signup you are not an user');
        return res.render('login',{message : req.flash('err')})
      }
  }catch(error) {
    console.log("error in verifyLogin :",error);
     res.redirect('/500');
    
  }
};


//load register
const loadRegister = async (req, res) => {
  try {
    res.render('signup');
  } catch (error) {
    console.log("error at loadRegister function :",error);
   res.redirect("/500")
  }
}


async function sendOTPverificationEmail(email,otp){
  try{

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to take messages:', success);
  }
});


const info = await transporter.sendMail({
  from: process.env.NODEMAILER_EMAIL,
  to: email,
  subject: "Verify your account",
  text: `Your OTP is ${otp}`,
  html: `<b>Your OTP: ${otp}</b>`,
});

console.log('Email sent info:', info);
return info.accepted.length > 0;


return info.accepted.length >0;

  }catch(error){
console.log('Error sending email',error);
return false;
  }
}


function generateOtp(){
  return Math.floor(100000 + Math.random()*900000).toString();

  
}

 
//insert new user
const insertUser = async(req,res)=>{
  try{
const { name,mobile,email,Cpassword,password} = req.body;
      if(password !== Cpassword){
        return res.render("signup",{message: "Passwords do not match"})
      }

      const findUser = await User.findOne({email});
      if(findUser){
        return res.render("signup",{message:"User this email is already exists"})
      }
      const otp = generateOtp();
      
      const emailSent = await sendOTPverificationEmail(email,otp);
      console.log("otp:",otp);
      if(!emailSent){
        return res.json("email.error");
      }
      req.session.userOtp = otp;
      req.session.userData = {name,mobile,email,password};
      
      res.render("EnterOtp",{ email: req.session.userData.email, otpErr: null });
      
  }catch(error){
  console.error("signup error",error);
  res.redirect('/500');
  }
 
}

//secure password
const securePassword = async (password)=>{
     
    const passwordHash = await bcrypt.hash(password,10);
    return passwordHash;

}

//otp verification
// const verifyOtp = async(req, res) => {
//   try {
//     const { otp } = req.body;
//     // console.log("otp:",otp)

//     if (otp == req.session.userOtp) {
//       const user = req.session.userData;
//       const passwordHash = await securePassword(user.password);
//       const timestamp = Date.now(); 
//       const randomString = Math.random().toString(36).substring(2, 10); 
//       const googleId = `${randomString}${timestamp}`;

//       const saveUserData = await User.create({
//         name: user.name,
//         email: user.email,
//         mobile: user.mobile,
//         password: passwordHash,
//         googleId 
//       });

//       //creating refferal link
//       const referalLink = `http://localhost:4000/register?refId=${saveUserData._id} `

//       saveUserData.referalLink=referalLink 
//       await saveUserData.save();
//       if(refId){
//         const findUser = await User.findById(refId);
//         if(findUser){
//           const orderId = null;
//         }
//       }
//        // Use findOne to get a single wallet document
//        const findWallet = await Wallet.create({
//         user:refId,
//         balance:200,
//         transactions:[{
//         transaction_id:`wallet_${uuid.v4()}`,
//         amount:200,
//         type:'credit',
//         description:"refferal fund",
//         orderId:orderId,
//         }],

//        });
//        await createdWallet.save();
       

//       // Set user session
//       req.session.user = saveUserData.id;
//       res.json({ success: true, redirectUrl: '/' });
//       return
//     } else {
//       res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
//     }
//   } catch (error) {
//     console.error("Error verifying OTP", error);
//     res.redirect("/500");
//   }
// };

// const verifyOtp = async (req, res) => {
//   try {
//     const { otp } = req.body;

//     if (otp == req.session.userOtp) {
//       const user = req.session.userData;
//       // req.session.user_id = saveUserData.id;
//       const passwordHash = await securePassword(user.password);
//       const timestamp = Date.now(); 
//       const randomString = Math.random().toString(36).substring(2, 10); 
//       const googleId = `${randomString}${timestamp}`;

//       // Save user data
//       const saveUserData = await User.create({
//         name: user.name,
//         email: user.email,
//         mobile: user.mobile,
//         password: passwordHash,
//         googleId,
//       });

//       // Create referral link
//       const referalLink = `http://localhost:4000/register?refId=${saveUserData._id}`;
//       saveUserData.referalLink = referalLink;
//       await saveUserData.save();

//       // Check for referral ID
//       const refId = req.body.refId || req.query.refId; // Extract referral ID if provided
//       if (refId) {
//         const findUser = await User.findById(refId);
//         if (findUser) {
//           const orderId = null;

//           // Create wallet
//           const createdWallet = await Wallet.create({
//             user: refId,
//             balance: 200,
//             transactions: [
//               {
//                 transaction_id: `wallet_${uuid.v4()}`,
//                 amount: 200,
//                 type: 'credit',
//                 description: "referral fund",
//                 orderId: orderId,
//               },
//             ],
//           });

//           await createdWallet.save();
//         }
//       }

//       // Set user session
//       req.session.user = saveUserData.id;
//       res.json({ success: true, redirectUrl: '/' });
//     } else {
//       res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
//     }
//   } catch (error) {
//     console.error("Error verifying OTP", error);
//     res.redirect("/500");
//   }
// };

const verifyOtp = async (req, res) => {
  try {
    const { otp, refId } = req.body; 
    const sessionOtp = req.session.userOtp;
    const sessionUser = req.session.userData;

    
    if (!otp || !sessionOtp || !sessionUser) {
      return res.status(400).json({ success: false, message: "Invalid session or OTP missing" });
    }

    
    if (otp === sessionOtp) {
     
      const passwordHash = await securePassword(sessionUser.password);

     
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const googleId = `${randomString}${timestamp}`;

     
      const newUser = await User.create({
        name: sessionUser.name,
        email: sessionUser.email,
        mobile: sessionUser.mobile,
        password: passwordHash,
        googleId,
      });

      
      const referralLink = `http://localhost:4000/register?refId=${newUser._id}`;
      newUser.referralLink = referralLink;
      await newUser.save();

      
      if (refId) {
        const referrer = await User.findById(refId);
        if (referrer) {
          const transactionId = `wallet_${uuid.v4()}`;
          await Wallet.create({
            user: refId,
            balance: 200,
            transactions: [
              {
                transaction_id: transactionId,
                amount: 200,
                type: 'credit',
                description: "Referral fund",
                orderId: null,
              },
            ],
          });
        }
      }

      
      req.session.user_id = newUser._id; 
      req.session.userOtp = null; 
      req.session.userData = null; 

      res.json({ success: true, redirectUrl: '/' });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
    }
  } catch (error) {
    console.error("Error in verifyOtp controller:", error);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
};






//resent OTP

const resendOtp = async(req,res)=>{
  try {
    const {email} = req.session.userData;
    if(!email){
      return res.status(400).json({success:false,message:"Email not found in session"})
    }

const otp = generateOtp();
req.session.userOtp = otp; //otp assigned to session
const emailSent = await sendOTPverificationEmail(email,otp);
if(emailSent){
  console.log("Resend OTP",otp);
  res.status(200).json({success:true,message:"OTP resend Successfully"})
}else{
  res.status(500).json({success:false,message:"Failed to resend OTP. Please try again"});
}

  } catch (error) {
    console.error("Error resending OTP",error);
    res.status(500).json({success:false,message:"Internal Server Error. Please try again"})
  }
}


const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect("/")
  } catch (error) {
   res.redirect("/500")
  }
}


//------------------------------------profile-------------------------------
//userProfile
//correct code

// const userProfile = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     if (!userId) {
//       return res.redirect('/login');
//     }
    
//     const user = await User.findById(userId);
//     let wallet = await Wallet.findOne({userId: user});
//     const orders = await Orders.find({ user: userId }).populate({
//       path: 'products.productId',
//       model: 'Product',
//       select: '_id name image'
//     });
  
//     if (!user) {
//       return res.redirect('/404');
//     }
//     res.render('userProfile', { user, orders, wallet ,discountedTotal: req.session.discountedTotal || null,  // Get discounted total from session
//       appliedCoupon: req.session.appliedCoupon || null});
//   } catch (error) {
//     console.log("error in userProfile controller:", error);
//     res.redirect('/500');
//   }
// };



const userProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.redirect('/login');
    }
    
    const user = await User.findById(userId);
    let wallet = await Wallet.findOne({userId: user});
    const orders = await Orders.find({ user: userId }).populate({
      path: 'products.productId',
      model: 'Product',
      select: '_id name image'
    })
    .sort({ createdAt: -1 });

    if (!user) {
      return res.redirect('/404');
    }
    res.render('userProfile', { user, orders, wallet ,discountedTotal: req.session.discountedTotal || null,  // Get discounted total from session
      appliedCoupon: req.session.appliedCoupon || null});
  } catch (error) {
    console.log("error in userProfile controller:", error);
    res.redirect('/500');
  }
};


const editProfile = async (req,res) => {
  try {
    const userId = req.session.user_id;
    // console.log("userId :",userId);
    const user = await User.findById(userId);
    // console.log("user from editedProfile :" ,user);
    if(!user) {
      return res.status(404).json({success: false, message: "User not found"})
    }

    user.name = req.body.name;
    user.mobile = req.body.mobile;

    await user.save();
    // console.log("user after save:",user);
    return res.status(200).json({success: true, message: 'Form submitted successfully' })
  } catch (error) {
     res.redirect("/500");
     return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}



//add address
const loadaddAddress = async (req,res) =>{
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
   
    if(!user){
      res.redirect("/");
    }
    res.render('addAddress',{user})
  } catch (error) {
    res.redirect('/500');
  }
}

const addAddressProfile = async (req,res)=>{
  try {
    const userId = req.session.user_id;
    const {name,mobile,pincode,address,city,state} = req.body;

    const user = await User.findById(userId);

    if(!user) {
      return res.status(400).send('User not found');
    }

    user.address.push({
      name,
      mobile,
      pincode,
      address,
      city,
      state
    });

    const updateUser = await user.save();
    if(updateUser){
      res.json({message:"adding success"});
    }
  } catch (error) {
    res.redirect('/500');
    // res.status(500).send('Internal Server Error');
  }
};


const editAddress = async (req,res)=>{
  try {
    const userId = req.session.user_id;
    const {name,mobile,pincode,address,city,state} = req.body;

    const updateUser = await User.findOneAndUpdate(
      {_id:userId, 'address._id' : req.params.id},
      {
        $set: {
          'address.$.name' : name,
          'address.$.mobile' : mobile,
          'address.$.pincode': pincode,
          'address.$.address': address,
          'address.$.city': city,
          'address.$.state': state,

        },
      },
      {new:true}
    );
    if (updateUser) {
      // console.log('Address updated successfully:',updateUser);
      res.status(200).json({ success: true, message: 'Address updated successfully'});
    }
  } catch (error) {
    // res.redirect("/500");
    res.status(500).json({ success: false, error: 'Internal server error' });

  }
};


const removeAddress = async(req,res)=>{
  try {
    const userId = req.session.user_id;
    const addressId = req.params.id;
    const user = await User.findById(userId);

    if(!user) {
      // If user is not found, return here to avoid further execution
      return res.status(404).json({ message: 'User not found' });
    }
    user.address.pull({_id:addressId});
    await user.save();

    res.status(200).json({ message: 'Address removed successfully' });
  } catch (error) {
    console.log("error in remove adress:",error)
    res.redirect("/500");
    // res.status(500).json({ error: 'Internal Server Error' });
  }
};

const changePassword = async(req,res)=>{
   
      const userId = req.session.user_id;
      const currentPassword = req.body.currentpassword;
      const newPassword = req.body.newpassword;
      const confirmNewPassword = req.body.confirmnewpassword;
      try {
        const user = await User.findById(userId);
        if(!user){
          return res.status(404).json({error:'User not found'});
        }
        if(currentPassword){
          const passwordMatch = await bcrypt.compare(currentPassword,user.password);
          if(!passwordMatch){
            return res.json({ message: 'Current password is incorrect'});
          }
        }

        if(newPassword !== confirmNewPassword) {
          return res.json({ message: 'New password and confirm password do not match'})
        }

        // update the user's password 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword,saltRounds);
        user.password = hashedPassword;

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({success:true, message:'Password changed successfully'});
    } catch (error) {
      console.log("error in changePassword:",error);
      res.redirect('/500');
      // return res.status (500).json({error: 'Internal server error'});
    }




}
  
const InternalServer = async(req,res)=>{
  try {
    res.render("500")
  } catch (error) {
   res.redirect("/500")
  }
}





 
const userNotFound = async(req,res)=>{
  try {
    res.render("400")
  } catch (error) {
   res.redirect("/400")
  }
}


module.exports = {
   
  loginLoad,
  verifyLogin,
  LoadIndex ,
  InternalServer,
  loadRegister,
  insertUser,
  sendOTPverificationEmail,
  verifyOtp, 
  resendOtp,
  userLogout,
  userProfile,
  userNotFound,
  loadaddAddress,
  addAddressProfile,
  editProfile,
  editAddress,
  removeAddress,
  forgotpassward,
  forgotOtpPage,
  FverifyOtp,
  resetPage,
  resetPassword,
  // loadProduct,
  changePassword,
  searchResult,
  filterResult,

  
  
  
    
}


