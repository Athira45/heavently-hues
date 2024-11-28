const User = require('../models/userModel');


const isLogin = async (req, res, next) => {
    try {
        // console.log("enterd");
        // console.log("isLogin Middleware",req.session.userData);
        if (req.session.userData) {
            if (req.path === '/login') {
                res.redirect('/');
                return;
            }else{
                next();

            }
        } else {
            if (req.path === '/login') {
                return next();

            }
        }
    } catch (error) {

        console.log(error.message);
    }
}



const isLogout = async (req, res, next) => {
    try {
        // console.log("isLogout",req.session.user_id);
        if (req.session.user_id) {
            return res.redirect('/')
        }
        next()

    } catch (error) {
        console.log(error.message);
    }
}




const isBlock = async (req, res, next) => {
    try {
        if (req?.session?.userData) {
            const email = req.session.userData.email; 
            // console.log("isBlock :",email)
            const user = await User.findOne({ email: email }); 
            // console.log("from isBlock",user);
            if (user?.status === "Block") {
                return res.render("blockPage");
            }else{
                next(); 
            }
        }else{
            next(); 
        }
    } catch (error) {
        console.log("error from isBlock", error);
        res.status(500).send("Internal Server Error"); 
    }
};


// const isBlock = async (req, res, next) => {
//     try {
//         if (req.session.userData) {
//             const email = req.session.userData;
//             const user = await User.findOne({ email: email }); // Use an object to find the user by email
//             if (user && user.status === "Block") {
//                 return res.render("blockPage"); // Render block page if user is blocked
//             }
//         }
//         next(); // Call next() if user is not blocked or not found
//     } catch (error) {
//         console.log("error from isBlock", error);
//         res.status(500).send("Internal Server Error");
//     }
// };


module.exports = {
    isLogin,
    isLogout,
    isBlock
}