
const Products = require("../models/productModel");
const multer = require('multer');
const Categories = require("../models/categoryModel");
const Cart = require('../models/cartModel')
const path = require('path');
const fs = require('fs');

const LoadAdProducts = async(req,res)=>{
    try {
        const categories = await Categories.find();
        res.render('addProducts',{categories});
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

        res.render('allProducts', {
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
//         const productId = req.params.id;
//         // const { croppedImage } = req.body;

      
//         const {
//           name,
//           description,
//           price,
//           discount,
//           category,
//           stock,
//           spec,
//           width, 
//           depth,
//           height,
//           material
//         } = req.body;

//       //   if (croppedImage) {
//       //     const base64Data = croppedImage.replace(/^data:image\/\w+;base64,/, "");
//       //     const fs = require('fs');
//       //     fs.writeFileSync('uploads/cropped-image.png', base64Data, 'base64');
//       //     console.log('Image successfully saved');
//       // }
  
//       // res.send('Product updated!');
    
//         // Get existing product from database
//         const existingProduct = await Products.findById(productId);
//         if (!existingProduct) {
//           return res.status(404).send('Product not found');
//         }
    
//         const newImages = req.files ? req.files.map(file => file.filename) : [];
//         const totalImages = [...existingProduct.image, ...newImages].slice(0, 3);
    
//         const updatedProduct = await Products.findByIdAndUpdate(
//           productId,
//           {
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
//             image: totalImages // Limit total images to a maximum of 3
//           },
//           { new: true, runValidators: true }
//         );
    
        
//         res.redirect('/admin/allProducts');
//       } catch (error) {
//         console.error('Error updating product with new images:', error);
//         res.status(500).send('An error occurred');
//       }
//   };
  
  const handleEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        // const { croppedImage } = req.body;
        const { croppedImage } = req.body;
      
        let newImageFilename = null;

        // Handle cropped image
        if (croppedImage) {
          // Ensure the uploads directory exists
          const uploadsDir = path.join(__dirname, '../uploads');
          console.log(uploadsDir)
          if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
          }
      
          // Generate unique filename
          newImageFilename = `cropped-${Date.now()}.png`;
          const filepath = path.join(uploadsDir, newImageFilename);
      
          // Remove the data URL prefix
          const base64Data = croppedImage.replace(/^data:image\/\w+;base64,/, '');
          
          // Write the file
          fs.writeFileSync(filepath, base64Data, 'base64');
          console.log('Cropped image saved:', newImageFilename);
      
          // Add the cropped image filename to the images array
          req.body.images = [newImageFilename];
      }
      

      
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

    
        // Get existing product from database
        const existingProduct = await Products.findById(productId);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // Handle other file uploads
        const newImages = req.files ? req.files.map(file => file.filename) : [];
        
        // Combine existing images with new images
        const allImages = [...existingProduct.image];
        if (newImageFilename) {
          allImages.push(newImageFilename);
      }
      
      // Add new uploaded images
      allImages.push(...newImages);

      // Limit total images to 3
      const totalImages = allImages.slice(0, 3);

    
        const updatedProduct = await Products.findByIdAndUpdate(
          productId,
          {
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
            material,
            image: totalImages // Limit total images to a maximum of 3
          },
          { new: true, runValidators: true }
        );
    
        
        res.redirect('/admin/allProducts');
      } catch (error) {
        console.error('Error updating product with new images:', error);
        res.status(500).send('An error occurred');
      }
  };

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
        res.redirect("/admin/allProducts");
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect("/500");
    }
};


const imageDelete = async (req, res) => {
    try {
        const { imageName } = req.body;
    
        // Fetch product and validate image
        const product = await Products.findOne({ "image": imageName });
        if (!product) {
          return res.status(400).json({ success: false, message: 'Image not found' });
        }
    
        // Remove the image from storage
        const fs = require('fs');
        const imagePath = path.join(__dirname, '../public/uploads', imageName);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Delete from filesystem
        }
    
        // Update database
        const updatedImages = product.image.filter(img => img !== imageName);
        await Products.updateOne({ _id: product._id }, { image: updatedImages });
    
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ success: false, message: 'Could not delete image' });
      }
};

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

    const relatedProduct = await Products.find({ 
        category: viewProduct.category,
        _id: { $ne: viewProduct._id }  
      })
      .populate('category', 'name') 
      .limit(4);

    //   console.log("related:",relatedProduct);
   
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


const userProducts = async (req, res) => {
    try {
      const user = req.session?.userData ? req.session?.userData : null;
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;
      const totalProducts = await Products.countDocuments();
      const totalPages = Math.ceil(totalProducts / limit);
  
      const query = req.query.q || '';
  
      const productList = await Products.find()
        .populate('category')
        .skip(skip)
        .limit(limit);
  
      const categories = await Categories.find();
  
      // Pass selectedSortOption as an empty string by default
      res.render("products", {
        user,
        productList,
        categories,
        currentPage: page,
        totalPages,
        totalProducts,
        query,
        selectedCategories: [], // No categories selected by default
        selectedSortOption: '', // No sort option selected by default
      });
    } catch (error) {
      console.log("error in userProducts function", error);
      res.redirect("/500");
    }
  };
  

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