
const Offer = require('../models/offerModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const loadOffer = async(req,res)=>{
  
    try {
        
        const offerData = await Offer.find()
        
        const categories = await Category.find();
        

        res.render('categoryOffer',{offerData,categories});
    } catch (error) {
        console.log("error in load offer :",error);
    }
}


const addCategoryOffer = async(req,res)=>{
    try {
console.log("entrrrr hereeeeeeeeeee");

        const { discount, startingDate,expiryDate,categoryId } = req.body;
        console.log("hhhhhhhhhhh",req.body)
    const categoryOffer = await Category.findOne({_id:categoryId})

console.log("jjjjj",categoryOffer);

       
        categoryOffer.category_discount = discount;
        categoryOffer.startingDate = startingDate;
        categoryOffer.expiryDate = expiryDate;

        categoryOffer.save();

        res.json({success:true});

        
        

        
    } catch (error) {
        console.log("error in addCategoryOffer :",error);
    }
}



// const categoryOffer = async (req,res)=>
// {   
//     try {
              
//        const {categoryId,discountpercentage,startingDate, expiryDate} = req.body;

//        const updateCategory = await Category.findByIdAndUpdate(categoryId,{
//         category_discount:discountpercentage,
//         startingDate:new Date(startingDate),
//         expiryDate:new Date(expiryDate)
//        },{new:true});

//        if(!updateCategory){
//         return res.status(404).json({message:'Category not found'})
//        }
//     //    res.status(200).json({message:'Category offer updated successfully',category: updateCategory})
//     res.json({success:true})

//     } catch (error) {
//         console.log("error in categoryOffr :,error");
//     }
// }


//update categoryoffer
const categoryOffer = async (req, res) => {   
    try {    
        const { categoryId, discountPercentage, startingDate, expiryDate } = req.body;
       
        const updateCategory = await Category.findByIdAndUpdate(categoryId, {
            category_discount: discountPercentage,
            startingDate: new Date(startingDate),
            expiryDate: new Date(expiryDate)
        }, { new: true });

        if (!updateCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ success: true });

    } catch (error) {
        console.log("Error in categoryOffer:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


module.exports = {
    loadOffer,
    categoryOffer,
    addCategoryOffer,

}