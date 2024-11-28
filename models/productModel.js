const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required:true,
    },
    price:{
        type:Number,
        min:0,
        required:true,
    },
    discount:{
        type:Number,
        required:false,
    },
    category :{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Categories'
    },
    description :{
        type:String,
    },
    image: {
        type:[String],
        required:true,
    },
    stock: {
        type:Number,
        required:true,
    },
    
    spec:{
    type:String,
    required:true,
    },

    width: {
        type: Number,
        required: false 
    },
    depth: {
        type: Number,
        required: false 
    },
    height: {
        type: Number,
        required: false 
    },
    material:{
      type:String,
      required:true,
    },
    is_listed :{
        type:String,
        enum:["Listed","Unlisted"],
        default:"Listed",
    },
    offer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'offer'
    },

},{timestamps:true})

// const Products = mongoose.model('products',productSchema)
const Products = mongoose.model('Product',productSchema)
module.exports = Products