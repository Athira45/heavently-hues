const User = require('../models/userModel');
const Products = require('../models/productModel');
const category = require('../models/categoryModel');
const Wishlist = require('../models/wishlistModel');
const Cart = require('../models/cartModel');


const loadWishlist = async(req,res)=>{
    try{
        const user = req.session.user_id;
        const wishlist = await Wishlist.findOne({user}).populate('products.productId');
       
        res.render('wishlist',{ wishlist ,user});

    } catch(error){
        console.log("error in load wishlist:",error);
        res.redirect('/500');

    }
}

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;



const addToWishlist = async (req, res) => {
    try {
        const productId = req.params.productid;
        const userId = req.session.user_id;

        // Check if user is logged in
        if (!userId) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        // Retrieve the product details
        const productToWishlist = await Products.findOne({ _id: productId });
        if (!productToWishlist) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Set product details
        const productName = productToWishlist.name;
        const productImage = productToWishlist.image[0];
        const productStock = productToWishlist.stock;
        const productPrice = productToWishlist.offerprice || productToWishlist.price;

        // Retrieve the user's wishlist
        const wishlist = await Wishlist.findOne({ user: userId });

        // If no wishlist exists, create a new one and add the product
        if (!wishlist) {
            const newWishlist = new Wishlist({
                user: userId,
                products: [{
                    productId,
                    name: productName,
                    price: productPrice,
                    Image: productImage,
                    stock: productStock
                }]
            });
            const savedWishlist = await newWishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist successfully.', wishlist: savedWishlist });
        }

        // Check if product is already in wishlist
        const isProductInWishlist = wishlist.products.some(item => item.productId.equals(productId));
        if (isProductInWishlist) {
            // Remove the product if it already exists in wishlist
            await Wishlist.updateOne({ user: userId },
                { $pull: { products: { productId: productId } } }
            );
            return res.status(200).json({ message: 'Product removed from wishlist' });
        }

        // Add product to wishlist if it's not already there
        wishlist.products.push({
            productId,
            name: productName,
            price: productPrice,
            Image: productImage,
            stock: productStock
        });

        const updatedWishlist = await wishlist.save();
        res.status(200).json({ message: 'Product added to wishlist successfully.', wishlist: updatedWishlist });

    } catch (error) {
        console.log("Error in addToWishlist:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const removeWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const user = req.session.user_id;

        // Find the wishlist for the current user
        const existingWishlist = await Wishlist.findOne({ user });

        if (!existingWishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        // Filter out the product to be removed
        existingWishlist.products = existingWishlist.products.filter(
            (wishlistItem) => !wishlistItem.productId.equals(productId)
        );

        // Save the updated wishlist
        const updatedWishlist = await existingWishlist.save();
        res.json({ success: true, message: "Product removed from the wishlist", updatedWishlist });
    
    } catch (error) {
        console.log("Error in removeWishlist:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// const wishAddToCart = async (req, res) => {
//     try {
//         const productId = req.params.productid;
//         const userId = req.session.user_id;
//         const quantity = req.body.quantity || 1;  // Set default to 1 if not provided

//         const productToCart = await Products.findOne({ _id: productId });
//         const cart = await Cart.findOne({ userid: userId });
//         const wishlist = await Wishlist.findOne({ user: userId });

//         if (!wishlist) {
//             return res.redirect("/");
//         }

//         if (productToCart && userId) {
//             const isProductInWishlist = wishlist && wishlist.products.some(item => item.productId.equals(productId));

//             // Remove product from wishlist
//             if (isProductInWishlist) {
//                 await Wishlist.updateOne(
//                     { user: userId },
//                     { $pull: { products: { productId: productId } } }
//                 );
//             }

//             const productImage = productToCart.image && productToCart.image.length > 0 ? productToCart.image[0] : "default-image.jpg";  // Provide a default image

//             if (cart) {
//                 const existingProductIndex = cart.products.findIndex(item => item.productId.toString() === productId);

//                 // If product is already in cart, increment quantity
//                 if (existingProductIndex !== -1) {
//                     const existingProduct = cart.products[existingProductIndex];
//                     existingProduct.quentity += quantity;
//                     existingProduct.totalPrice = existingProduct.quentity * existingProduct.productPrice;
//                 } else {
//                     // Add new product to cart
//                     cart.products.push({
//                         productId: productId,
//                         quentity: quantity,
//                         productPrice: productToCart.offerprice || productToCart.price,
//                         totalPrice: (productToCart.offerprice || productToCart.price) * quantity,
//                         Image: productImage, // Use the resolved image value
//                     });
//                 }

//                 await cart.save();
//             } else {
//                 // Create a new cart if it doesn't exist
//                 const newCart = new Cart({
//                     userid: userId,
//                     products: [
//                         {
//                             productId: productId,
//                             quentity: quantity,
//                             productPrice: productToCart.offerprice || productToCart.price,
//                             totalPrice: (productToCart.offerprice || productToCart.price) * quantity,
//                             Image: productImage, // Use the resolved image value
//                         },
//                     ],
//                 });

//                 await newCart.save();
//             }

//             return res.status(200).json({ message: "Product added to cart successfully." });
//         } else {
//             return res.status(400).json({ error: "Invalid product or user." });
//         }
//     } catch (error) {
//         console.log("Error in wishAddToCart:", error);
//         return res.redirect("/500");
//     }
// };

const wishAddToCart = async(req,res) => {
    try {
        console.log("entrrrrr")
        const productId = req.params.productid;
        console.log("productId",productId)
        const userId = req.session.user_id;

        const productToCart = await Products.findOne({_id: productId});
        const cart = await Cart.findOne({userid: userId});
        const wishlist = await Wishlist.findOne({user:userId});

        if(!wishlist){  
            res.redirect('/');

        }

        if(productToCart && userId ){
            const isProductInWishlist = wishlist && wishlist.products.some((item)=>item.productId.equals(productId));

            if(isProductInWishlist){
                console.log("nnnnnnnnnnnnn",isProductInWishlist);
                
                await Wishlist.updateOne(
                    {user:userId},
                    {$pull:{products:{productId}}}
                );
            }

            if(cart){
                console.log("cart is there ");
                
                const existingProductIndex = cart.products.findIndex((item) => item.productId.toString() === productId);

                if(existingProductIndex !== -1){
                   const existingProduct = cart.products[existingProductIndex];
                   existingProduct.quantity += 1;
                   existingProduct.totalPrice = existingProduct.quantity * existingProduct.totalPrice;
                } else {
                    cart.products.push({
                        productId: productId,
                        quantity:1,
                       
                        productPrice : productToCart.offerprice || productToCart.price,
                        totalPrice: productToCart.offerprice || productToCart.price,
                        image: productToCart.image[0],

                    })
                }

                await cart.save();
                console.log("cart to added")

            }else{
                console.log("enter into elseeeeee")
                const newCart = new Cart({
                    userid:userId,
                    products:[
                        {
                            productId: productId,
                            quantity:1,
                            productPrice:productToCart.offerprice || productToCart.price,
                            totalPrice: productToCart.offerprice || productToCart.price,
                            Image: productToCart.image[0],
                        },
                    ],
                });
                await newCart.save();

            }
            res.status(200).json({message: "Product added to cart successfully."})
        }else{
            res.status(400).json({error: "Invalid product or user."});
        }
        
    } catch (error) {
        console.log("error from wishAddToCart :", error);
        res.status(500).json({ error: "Internal server error." });

        
    }
}






module.exports={
    loadWishlist,
    addToWishlist,
    removeWishlist,
    wishAddToCart,
}