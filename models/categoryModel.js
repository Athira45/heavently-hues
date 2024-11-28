
const mongoose=require("mongoose")
const productCategory=mongoose.Schema({

    name:{
        type:String,
        required:true,
        unique:true
    },
   
    is_listed: {
        type: String,
        enum: ['Listed', 'Unlisted'],
        default: 'Listed',
      },
     
      offer:{
        type:String,
        
      },
      category_discount : {
        type:Number,
        default:0,

      },
      startingDate:{
        type:Date,
        default:Date.now,
    },
    expiryDate:{
      type:Date,
      index: {expires: 0},
  },

      
})

const Category= mongoose.model("Categories",productCategory)

module.exports=Category