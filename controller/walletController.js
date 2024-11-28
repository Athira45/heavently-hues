const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

// const loadWallet = async(req,res)=>{
//     try {
//         const userId = req.session.user_id;
//         const user = await User.findById(userId);
//         // const userData = await User.findOne({user});
//         const wallet = await Wallet.findOne({user}).lean();

//         if(!wallet) {
//             return res.render('wallet',{user,balance:0,history:[],currentPage:1,totalPages:1});
//         }

//         const page = Number(req.query.page) || 1;
//         const limit = 5;
//         const skip = (page - 1) * limit;

//         const sortedHistory = wallet.history.sort((a, b) => new Date(b.date) - new Date(a.date));
//         const paginatedHistory = sortedHistory.slice(skip, skip + limit);

//         const totalItems = sortedHistory.length;
//         const totalPages = Math.ceil(totalItems / limit);
       
//         res.render('wallet', {
//             user,
            
//             balance: wallet.balance,
//             history: paginatedHistory,
//             currentPage: page,
//             totalPages: totalPages
//         })
//     } catch (error) {
//         console.log("error in load wallet:",error);
//     }
// }


const loadWallet = async(req,res)=>{
    try {
    
        const user = req.session.user_id;
        
        let wallet = await Wallet.findOne({userId: user});
        
        if(!wallet) {
            return res.render('wallet',{wallet});
        }

        wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
       
        res.render('wallet', { wallet,user })
    } catch (error) {
        console.log("error in load wallet:",error);
    }
}





module.exports = {
    loadWallet
}