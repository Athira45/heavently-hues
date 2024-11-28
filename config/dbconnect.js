const mongoose = require('mongoose');


const dbconnect = async(req,res)=>{
try{
    const connect = await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connect at MongoDB");
}catch(error){
    console.log("Database error",error);
}
}
module.exports = dbconnect