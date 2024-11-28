const mongoose = require("mongoose");
const wishlistSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

    products:[{
      productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
      },
      name:{
        type:String,
        required:true,
      },
      price:{
        type:Number,
        required:true,
      },
      Image:{
        type:String,
      },
      stock:{
        type:Number,
        required:true
      }
    }],
});


const Wishlist = mongoose.model('Wishlist',wishlistSchema);
module.exports = Wishlist;


