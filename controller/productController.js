const Products = require("../models/productModel");
const multer = require('multer');
const Categories = require("../models/categoryModel");
const Cart = require('../models/cartModel')
const path = require('path');
const fs = require('fs');

const LoadAdProducts = async(req,res)=>{
    try {
        const categories = await Categories.find();
        res.render('AddProducts',{categories});
    } catch (error) {
        console.error('Error loading dashboard:', error);
       
    }
}

//Load edit product

const LoadAllProducts = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const totalProducts = await Products.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);// calculate total pages
       // Fetch products for the current page
        const productList = await Products.find()
        .populate('category')
        .skip(skip)
        .limit(limit);

        const categoryData = await Categories.find();

        res.render('AllProducts', {
            productList,
            categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts,
            limit: limit
        });

        
       
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.redirect("/500");
    }
}





const LoadEditProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Products.findById(productId).populate('category');
        const categories = await Categories.find();
        
        if (!product) {
            return res.redirect('/allProducts');
        }
        
        res.render("productEdit", { 
            product, 
            categories,
            error: null,
            success: null
        });
    } catch (error) {
        console.log("Error from loadEdit product:", error);
        res.redirect("/500");
    }
};

// const handleEditProduct = async (req, res) => {
//     try {
//         // console.log('edit product')
//         const productId = req.params.id;
//         // const images = req.files.map(file => file.filename);
//         const { name, description, price,discount, category,stock,spec,width,depth,height,material } = req.body;
//         // const images = req.files ? req.files.map(file => file.filename) : [];

//         const existingProduct = await Products.findById(productId);

//         if (!existingProduct) {
//             return res.status(404).send('Product not found');
//         }

       
//         existingProduct.name = name;
//         existingProduct.description = description;
//         existingProduct.price = price;
//         existingProduct.discount = discount;
//         existingProduct.category = category;
       
//         existingProduct.stock = stock;
//         existingProduct.spec = spec;
//         existingProduct.depth = depth;
//         existingProduct.width = width;
//         existingProduct.height=height;
//         existingProduct.material = material;
//         // existingProduct.image = images;

        
//         // Save the updated product
//         await existingProduct.save();
//         res.redirect("/admin/allProducts");
//     } catch (error) {
//         console.log(error.message);
//         res.redirect("/500")
       
        
//     }
// };
   



// const handleEditProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         const {
//             name,
//             description,
//             price,
//             discount,
//             category,
//             stock,
//             spec,
//             width,
//             depth,
//             height,
//             material
//         } = req.body;

//         // Basic validation
//         if (!name?.trim() ||isNaN(Number(price)) ||!category?.trim() ||isNaN(Number(stock)) || !spec?.trim() ||!material?.trim()) {
//             const categories = await Categories.find();
//             const product = await Products.findById(productId);
//             return res.render('productEdit', {
//                 product,
//                 categories,
//                 error: 'Please fill all required fields',
//                 success: null
//             });
//         }

//         // Find existing product
//         const existingProduct = await Products.findById(productId);
//         if (!existingProduct) {
//             return res.status(404).send('Product not found');
//         }

//         // Update basic information
//         const updateData = {
//             name,
//             description,
//             price: Number(price),
//             discount: discount ? Number(discount) : 0,
//             category,
//             stock: Number(stock),
//             spec,
//             width: width ? Number(width) : null,
//             depth: depth ? Number(depth) : null,
//             height: height ? Number(height) : null,
//             material
//         };

//         // Handle image updates
//         if (req.files && req.files.length > 0) {
//             const newImages = req.files.map(file => file.filename);
//             // Combine existing images with new ones, limit to 3
//             const updatedImages = [...existingProduct.image, ...newImages].slice(0, 3);
//             updateData.image = updatedImages;
//         }

//         // Update the product
//         await Products.findByIdAndUpdate(productId, updateData, { new: true });

//         // Redirect with success message
//         res.redirect('/admin/allProducts');

//     } catch (error) {
//         console.log("Error updating product:", error);
//         res.status(500).send('An error occurred while updating the product');
//     }
// };


// const uploadProduct = async(req,res)=>{
//     try {
       
//         const images = req.files.map(file => file.filename);
//         // console.log('this is the image',images);

//         const { name, description, price, discount, categoryId, status ,stock,spec,width,depth,height,material} = req.body;

//         const newProduct = new Products({
//             name,
//             description,
//             price,
//             discount,
//             category: categoryId,
//             status,
//             // brand,
//             stock,
//             spec,
//            width,
//            depth,
//            height,
//             material,
//             image: images,
//         });       
//         await newProduct.save();
//         // console.log("new pro:",newProduct);
//          res.redirect('/admin/allProducts')

//     }catch (error) {
//         console.error('Error loading uploadproduct:', error);
//         res.redirect("/500")
//     }
// }

const handleEditProduct = async (req, res) => {
    try {
        console.log("handleEditProduct");
        const productId = req.params.id;
        // console.log('Received input:',req.body);
        const {
            name,
            description,
            price,
            discount,
            category,
            stock,
            spec,
            width,
            depth,
            height,
            material
        } = req.body;
        console.log(name, description,spec);

        // Improved validation with detailed error messages
        const validationErrors = [];
        
        if (!name?.trim()) validationErrors.push('Product name is required');
        if (!description?.trim()) validationErrors.push('Description is required');
        if (!price || isNaN(Number(price)) || Number(price) < 0) validationErrors.push('Valid price is required');
        if (!category?.trim()) validationErrors.push('Category is required');
        if (!stock || isNaN(Number(stock)) || Number(stock) < 0) validationErrors.push('Valid stock quantity is required');
        if (!spec?.trim()) validationErrors.push('Specification is required');
        if (!material?.trim()) validationErrors.push('Material is required');

        // If validation fails, re-render the form with errors
        if (validationErrors.length > 0) {
            const categories = await Categories.find();
            const product = await Products.findById(productId);
            return res.render('productEdit', {
                product,
                categories,
                error: validationErrors.join(', '),
                success: null
            });
        }

        // Find existing product
        const existingProduct = await Products.findById(productId);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // Clean and validate numeric values
        const updateData = {
            name: name.trim(),
            description: description.trim(),
            price: Math.max(0, Number(price)),
            discount: discount ? Math.max(0, Number(discount)) : 0,
            category: category.trim(),
            stock: Math.max(0, Number(stock)),
            // spec: spec.trim(),
            spec: spec.trim(),
            width: width ? Math.max(0, Number(width)) : null,
            depth: depth ? Math.max(0, Number(depth)) : null,
            height: height ? Math.max(0, Number(height)) : null,
            material: material.trim()
        };

        // Handle image updates
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            const updatedImages = [...existingProduct.image, ...newImages].slice(0, 3);
            updateData.image = updatedImages;
        }

        // Update the product
        const updatedProduct = await Products.findByIdAndUpdate(
            productId, 
            updateData, 
            { new: true, runValidators: true }
        );
    console.log("updatedProduct",updatedProduct);
        // Redirect with success message
        req.flash('success', 'Product updated successfully'); // If you're using flash messages
        res.redirect('/admin/allProducts');

    } catch (error) {
        console.error("Error updating product:", error);
        const categories = await Categories.find();
        const product = await Products.findById(req.params.id);
        return res.render('productEdit', {
            product,
            categories,
            error: 'An error occurred while updating the product',
            success: null
        });
    }
};


// const handleEditProduct = async (req, res) => {
//     try {
//         console.log("handleEditProduct");
//         const productId = req.params.id;
        
//         // Extract form fields
//         const {
//             name,
//             description,
//             price,
//             discount,
//             category,
//             stock,
//             spec,
//             width,
//             depth,
//             height,
//             material,
//             croppedImages
//         } = req.body;
        
//         console.log(name, description, spec);

//         // Improved validation with detailed error messages
//         const validationErrors = [];
        
//         if (!name?.trim()) validationErrors.push('Product name is required');
//         if (!description?.trim()) validationErrors.push('Description is required');
//         if (!price || isNaN(Number(price)) || Number(price) < 0) validationErrors.push('Valid price is required');
//         if (!category?.trim()) validationErrors.push('Category is required');
//         if (!stock || isNaN(Number(stock)) || Number(stock) < 0) validationErrors.push('Valid stock quantity is required');
//         if (!spec?.trim()) validationErrors.push('Specification is required');
//         if (!material?.trim()) validationErrors.push('Material is required');

//         // If validation fails, re-render the form with errors
//         if (validationErrors.length > 0) {
//             const categories = await Categories.find();
//             const product = await Products.findById(productId);
//             return res.render('productEdit', {
//                 product,
//                 categories,
//                 error: validationErrors.join(', '),
//                 success: null
//             });
//         }

//         // Find existing product
//         const existingProduct = await Products.findById(productId);
//         if (!existingProduct) {
//             return res.status(404).send('Product not found');
//         }

//         // Clean and validate numeric values
//         const updateData = {
//             name: name.trim(),
//             description: description.trim(),
//             price: Math.max(0, Number(price)),
//             discount: discount ? Math.max(0, Number(discount)) : 0,
//             category: category.trim(),
//             stock: Math.max(0, Number(stock)),
//             spec: spec.trim(),
//             width: width ? Math.max(0, Number(width)) : null,
//             depth: depth ? Math.max(0, Number(depth)) : null,
//             height: height ? Math.max(0, Number(height)) : null,
//             material: material.trim()
//         };

//         // Handle image updates and cropping
//         if (req.files && req.files.length > 0) {
//             const newImages = req.files.map(file => file.filename);

//             // If cropping data is provided
//             if (croppedImages && croppedImages.length > 0) {
//                 // Assuming croppedImages contains data about cropped sections of the uploaded images
//                 newImages.forEach(async (image, index) => {
//                     const croppedImage = croppedImages[index]; // Crop data for the specific image
//                     if (croppedImage) {
//                         // Example using sharp for cropping (server-side)
//                         const sharp = require('sharp');
//                         const inputPath = `uploads/${image}`; // Path of the uploaded image
//                         const outputPath = `uploads/cropped_${image}`; // Path to save cropped image

//                         // Crop the image using sharp
//                         await sharp(inputPath)
//                             .extract({
//                                 left: croppedImage.x,
//                                 top: croppedImage.y,
//                                 width: croppedImage.width,
//                                 height: croppedImage.height
//                             })
//                             .toFile(outputPath);

//                         // Replace the original uploaded image with the cropped image
//                         image = outputPath;
//                     }
//                 });
//             }

//             const updatedImages = [...existingProduct.image, ...newImages].slice(0, 3);
//             updateData.image = updatedImages;
//         }

//         // Update the product
//         const updatedProduct = await Products.findByIdAndUpdate(
//             productId, 
//             updateData, 
//             { new: true, runValidators: true }
//         );
//         console.log("updatedProduct", updatedProduct);

//         // Redirect with success message
//         req.flash('success', 'Product updated successfully');
//         res.redirect('/allProducts');

//     } catch (error) {
//         console.error("Error updating product:", error);
//         const categories = await Categories.find();
//         const product = await Products.findById(req.params.id);
//         return res.render('productEdit', {
//             product,
//             categories,
//             error: 'An error occurred while updating the product',
//             success: null
//         });
//     }
// };





const uploadProduct = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const images = req.files.map(file => file.filename);
        console.log('Processed images:', images);

        const { name, description, price, discount, categoryId, status, stock, spec, width, depth, height, material } = req.body;

        const newProduct = new Products({
            name, price, description, discount, category: categoryId, status, stock, spec, width, depth, height, material, image: images
        });

        await newProduct.save();
        
        res.status(200).json({ message: 'Product uploaded successfully', newProduct });
    } catch (error) {
        console.error('Error uploading product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}



const productDelete = async (req, res) => {
    try {
        const productId = req.query.id;
        const deleteProduct = await Products.findByIdAndDelete(productId);

        if (!deleteProduct) {
            return res.status(404).send('Product not found');
        }     
        // res.redirect("/admin/editProduct");
        res.redirect("/admin/AllProducts");
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect("/500");
    }
};


const imageDelete = async (req, res) => {
    try {
        console.log('entrrr delete')
        const { productId, imageId } = req.params;
       console.log('prod and img',productId,imageId)

        const product = await Products.findById(productId);

        
        if (!product) {
            return res.status(404).send('Product not found');
        }

        
        if (imageId < 0 || imageId >= product.image.length) {
            return res.status(400).send('Invalid image ID');
        }

        const filenameToDelete = product.image[imageId]; 
        const filePath = path.join(__dirname, '../public/uploads', filenameToDelete); 


        
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).send('Error deleting file');
            }
        });

        
        product.image.splice(imageId, 1);
        await product.save();
    //  console.log("img deleted")
       res.status(200).send('img deleteee')
    } catch (error) {
        console.error('Error deleting image:', error.message);
        res.status(500).send('Server error');
    }
};

// const imageDelete = async (req, res) => {
//     try {
//         const { index, id } = req.query;
//         const product = await Products.findById(id);

//         if (!product || !product.image) {
//             return res.status(404).send('Product or image not found');
//         }

//         const imageIndex = parseInt(index);
//         if (imageIndex >= 0 && imageIndex < product.image.length) {
//             const imageToDelete = product.image[imageIndex];
            
//             // Remove image from array
//             product.image.splice(imageIndex, 1);
//             await product.save();

//             // Delete physical file
//             const imagePath = path.join(__dirname, '../public/uploads', imageToDelete);
//             fs.unlink(imagePath, (err) => {
//                 if (err) console.error('Error deleting file:', err);
//             });

//             return res.redirect(`/admin/editProduct?id=${id}`);
//         }

//         res.status(400).send('Invalid image index');

//     } catch (error) {
//         console.log("Error in imageDelete:", error);
//         res.status(500).send('Server error');
//     }
// };




const listunlistProduct = async (req, res) => {
    try {
        const id = req.query.id;
        console.log("id")
        const product = await Products.findOne({ _id: id });
        if (product) {
            const newStatus = product.is_listed === "Listed" ? "Unlisted" : "Listed";
            const updatedProduct = await product.findByIdAndUpdate(id, { $set: { is_listed: newStatus } }, { new: true });
            const allProducts = await product.find();
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.redirect("/admin/allProducts")
        } else {
            res.send("Unlisting failed");
        }
    } catch (error) {
        console.log("err in listunlist product :", error);
        res.redirect("/500")
        // res.status(500).send("Internal Server Error");
    }
};


const renderProductDetails = async(req,res)=>{
    try{
        const userid = req.session.user_id;
      const queryProduct = req.params.id;
    
    const user = req.session?.userData ? req.session?.userData : null;

       
      const viewProduct = await Products.findById(queryProduct)
      .populate({
        path:'category',
        populate:{
            path:'offer',
            match:{
                startingDate: {$lte: new Date()},
                expiryDate: {$gte: new Date()}
            }
        }
      })
      .populate({
        path:'offer',
        match:{
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() }
        }
      })
      .exec();
      if (!viewProduct) {
        return res.status(404).send('Product not found');
      }

      let discountProductprice = 0;
      let discountCategoryprice = 0;
      let discountProductPercentage;
      let discountCategoryPercentage;
     
      if(viewProduct.offer) {
        discountProductprice = viewProduct.price - (viewProduct.price * viewProduct.offer.discount / 100);
        discountProductPercentage = viewProduct.offer.discount;
    } else if (viewProduct.category?.offer) {
        discountCategoryprice = viewProduct.price - (viewProduct.price * viewProduct.category.offer.discount / 100);
        discountCategoryPercentage = viewProduct.category.offer.discount;
      
      }


    const relatedProduct = await Products.find({category:viewProduct.category,
        _id: { $ne: viewProduct._id }  
     } ).limit(4);

      
   
    const checkCart = await Cart.findOne({ userid});
    let alreadyCart = false;
    if(checkCart){
        alreadyCart = checkCart.products.some(product => product.productId.toString() === queryProduct);
    }
      res.render("productDetails",{user,viewProduct,relatedProduct, discountProductprice,discountProductPercentage,discountCategoryprice,discountCategoryPercentage,alreadyCart }) ;
     
    }catch(error){
      console.log("error in productDetails",error);
      res.redirect("/500")
        res.status(500).send('Internal Server Error');
    }
};


const userProducts = async(req,res)=>{

    try {
        
        const user = req.session?.userData ? req.session?.userData : null;
       
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const totalProducts = await Products.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        const productList = await Products.find()
         .populate('category')
         .skip(skip)
         .limit(limit);
        const categories = await Categories.find()
        productList.forEach(product =>{
            // console.log('product',product.category)
        })
       
        res.render("products",{user,productList,categories,currentPage:page , totalPages:totalPages , totalProducts})
    } catch (error) {
        console.log("error in userProducts funtn",error);
        res.redirect("/500")
    }
}



module.exports = {
    LoadAdProducts,
    LoadAllProducts,
    uploadProduct,
    LoadEditProduct,
    handleEditProduct,
    productDelete,
    listunlistProduct,
    renderProductDetails,
    imageDelete,
    userProducts,
}



