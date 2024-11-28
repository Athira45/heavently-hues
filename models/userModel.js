const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    mobile:{
        type:String,
        required:false,
        default:null,
    },
    googleId : {
       type:String,
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:false
    },
    address:[
        {
            name:{
                type:String,
                required:true
            },
            mobile:{
                type:String,
                required:true
                
            },
           
            pincode:
            {
                type:String,
                required:true
            },
            address:
            {
                type:String,
                required:true
            },
            city:{
                type:String,
                required:true
            },
            state:
            {
                type:String,
                enum: ['Kerala','Tamil Nadu', 'Karnataka', 'Goa', 'Mumbai'],
                required:true

            }
        }
    ],

    is_admin:{
        type:Number,
        
    },
    is_verified:{
        type:Number,
        default:0
    },
    status:{
        type: String,
        uStatus: ['Active', 'Block'],
        default: 'Active'
    },
    

    
})

module.exports = mongoose.model('User',userSchema);