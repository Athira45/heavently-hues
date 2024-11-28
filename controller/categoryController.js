const category = require ("../models/categoryModel");



// const LoadAdminCategory = async(req,res)=>{
//     try {
//         const categoryData = await category.find()
//         const messages = {
//             nameError: req.flash('nameError'),
//         };
       
//         res.render('AdCategory',{categoryData,messages});  

//     } catch (error) {
//         console.error('Error loading dashboard:', error);
       
//     }
// }

const LoadAdminCategory = async(req,res)=>{
    try {
        const categoryData = await category.find()
       
        res.render('AdCategory',{categoryData});  // inserted categoryData send to AdCatagory page
    } catch (error) {
        console.error('Error loading dashboard:', error);
       
    }
}
       


const insertCategory = async (req, res) => {
   
    try {
        const { name } = req.body;   
        
        const existingCategory = await category.findOne({ name });
        
        
        // if (existingCategory) {
        //     return res.status(400).send("Category with the same name already exists");
        // }
        if (existingCategory) {
            
            // return res.status(400).send("Category with the same name already exists");
           req.flash('error','Category with the same name already exists');
          
            return res.redirect("/admin/adCategory");
        }
        
        const newCategory = new category({
            name,
            
        });
       
        await newCategory.save();
        return res.redirect("/admin/adCategory"); 
    } catch (error) {
        console.error("Error inserting category:", error); 
        return res.status(500).send("Internal Server Error"); 
    }
};


const  LoadEditCategory = async (req, res) => {
    try {
        const categoryId = req.query.id   
        const Category = await category.findById(categoryId); 
        
        res.render("categoryEdit", { Category });
    } catch (error) {
        res.redirect("/500")
    }
}

// const updateCategory = async (req, res) => {
//     try {
//         const categoryId = req.body.id; 
//         console.log(categoryId)
//         const { name } = req.body;
       
//         const existingCategory = await category.findOne({ name:  { $regex: new RegExp("^" + name + "$", "i") }, _id: { $ne: categoryId }  });
        
//         if (existingCategory) {
//             req.flash('error','Category with the same name already exists');
//             return res.redirect("/admin/adCategory");
//             // return res.send("Category name already exists")
//         }
//         //updating
//         const updatedCategory = await category.findByIdAndUpdate(categoryId, { name }, { new: true });
//         if (!updatedCategory) {
//             console.log("Category not found");
//         }

//         await updatedCategory.save();
//         res.redirect("/admin/adCategory")
//     } catch (error) {
//         res.redirect("/500")
//         res.status(500).send("Internal Server Error");
//     }
// };


const updateCategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        const existingCategory = await category.findOne({
            name: { $regex: new RegExp("^" + name + "$", "i") },
            _id: { $ne: categoryId },
        });

        if (existingCategory) {
            // If a category with the same name exists, show error message
            req.flash('nameError', 'Category with the same name already exists');
            return res.redirect(`/admin/editCategory?categoryId=${categoryId}`);
        }

        // Updating the category name if no existing category is found
        const updatedCategory = await category.findByIdAndUpdate(categoryId, { name }, { new: true });
        if (!updatedCategory) {
            console.log("Category not found");
        }

        await updatedCategory.save();
        res.redirect("/admin/adCategory");
    } catch (error) {
        res.redirect("/500");
        // res.status(500).send("Internal Server Error");
    }
};



const deleteCategory = async (req,res)=>{
    try{
        const categoryId = req.query.id;
        console.log(categoryId);
        const deletingCategory = await category.findByIdAndDelete(categoryId);
        res.redirect('/admin/adCategory')
    }catch (error){
        console.log("error is at delete category of admin : ",error);
        res.status(500).redirect('/500');
    }
};


const listUnlistCategory = async (req, res) => {
    try {
        const id = req.query.id;
       
        const Category = await category.findOne({ _id: id });
       
        if (Category) {
            const newStatus = Category.is_listed === "Listed" ? "Unlisted" : "Listed";
           
            await category.findByIdAndUpdate(id, { $set: { is_listed: newStatus } });
            const allCategory = await category.find();

            // Set caching headers
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.redirect('/admin/adCategory'); 
        } else {
            res.send("Category not found");
        }
    } catch (error) {
        console.log("error is at listunlist category of admin : ",error);
        res.status(500).redirect('/500');
    }
};



module.exports = {
    insertCategory,
    LoadAdminCategory,
    LoadEditCategory,
    updateCategory,
    listUnlistCategory,
    deleteCategory,
}