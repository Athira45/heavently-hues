const User = require('../models/userModel');
const Wallet = require('../models/walletModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Products = require("../models/productModel");
const Coupon = require('../models/couponModel')

// const loadCartPage = async(req,res)=>{
//     try {
//         const user = req.session.user_id;
//         const cartData = await Cart.findOne({userid:user}).populate({
//             path: "products.productId",
//             model:"products",
//         });

//         if(!cartData){
//             res.render("cartpage",{user,cartData: { products: [] }});
//             return;
//         }

//         if(cartData.products.length > 0) {
//             cartData.products.forEach((product)=>{
//                 const productPrice = product.productId.offerprice || product.productId.price;
//                 product.productTotalPrice = productPrice * product.quantity;
//             });

//             const totalPriceTotal = cartData.products.reduce((total,product) => total + product.productTotalPrice,0);
//             res.render("cartpage", { user,cartData, totalPriceTotal });
//         }else{
//             res.render("cartpage", { user,cartData });
//         }
//     } catch (error) {
//         console.log("error in load cartpage:", error);
//     }
// }

// const loadCartPage = async(req,res)=>{
//     try {
//         const user = req.session.user_id;
//         const cartData = await Cart.findOne({ userid: user })
//         .populate({
//           path: 'products.productId',
//           model: 'Product',
//           populate: {
//             path: 'category',  // Populate the category field within the product
//             model: 'Categories'
//           }
//         });
      

//         let totalPriceTotal = 0;
//         // let subtotal = 0;
//         if(!cartData){
//             return res.render("cartpage",{user, cartData: null, totalPriceTotal});
//         }

//         if(cartData.products.length > 0) {
//             cartData.products.forEach((product)=>{
//             let productPrice
//             console.log('cardata products',product)
//         if(product.productId.discount && product.productId.category.category_discount ){
//            console.log('discount',product.productId.category.category_discount)
//             productPrice =  product.productId.discount
//             console.log('product price',productPrice)
//        } else if(!product.productId.discount && product.productId.category.category_discount){
           
       
//            productPrice = product.productId.price - (product.productId.price * product.productId.category.category_discount / 100);

//        }
      
       
   
//                  productPrice = product.productId.discount || product.productId.price;
//                 product.productTotalPrice =Number( productPrice) * product.quantity;
//                 // subtotal += product.productTotalPrice;
              
//             });
            

//             totalPriceTotal = cartData.products.reduce((total,product) => total + product.productTotalPrice,0);
//             // console.log("llllllllll:",totalPriceTotal)
//         }
//         cartData.subtotal = totalPriceTotal 
//         await cartData.save();
//         res.render("cartpage", { user, cartData, totalPriceTotal });

//     } catch (error) {
//         console.log("error in load cartpage:", error);
//         // res.status(500).render("error", { message: "An error occurred while loading the cart page." });
//         res.redirect('/500');
//     }
// }

const loadCartPage = async(req, res) => {
    try {
        const user = req.session.user_id;
        const cartData = await Cart.findOne({ userid: user })
            .populate({
                path: 'products.productId',
                model: 'Product',
                populate: {
                    path: 'category', // Populate the category field within the product
                    model: 'Categories'
                }
            });

        let totalPriceTotal = 0;

        if (!cartData) {
            return res.render("cartpage", { user, cartData: null, totalPriceTotal });
        }

        if (cartData.products.length > 0) {
            cartData.products.forEach((product) => {
                let productPrice;
                const productExists = product.productId;
                const categoryExists = productExists && product.productId.category;
                
                // Check if the product and category exist before accessing their fields
                if (productExists && product.productId.discount && categoryExists && product.productId.category.category_discount) {
                    productPrice = product.productId.discount;
                } else if (productExists && !product.productId.discount && categoryExists && product.productId.category.category_discount) {
                    productPrice = product.productId.price - (product.productId.price * product.productId.category.category_discount / 100);
                } else if (productExists) {
                    productPrice = product.productId.price;
                } else {
                    productPrice = 0; // Default to 0 if product data is missing
                }

                product.productTotalPrice = Number(productPrice) * (product.quantity || 1);
            });

            totalPriceTotal = cartData.products.reduce((total, product) => total + (product.productTotalPrice || 0), 0);
        }

        cartData.subtotal = totalPriceTotal;
        await cartData.save();
        res.render("cartpage", { user, cartData, totalPriceTotal });

    } catch (error) {
        console.log("error in load cartpage:", error);
        res.redirect('/500');
    }
};

const addToCart = async (req, res) => {
    try {
        const product_id = req.params.productid;
        const userid = req.session.user_id;
        const quantity = parseInt(req.params.quantity, 10);

        if (!userid) {
            return res.status(401).json({ error: "Unauthorized - User not authenticated" });
        }

        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ error: "Invalid quantity value." });
        }

        const productToCart = await Products.findById(product_id).populate('category');
        if (!productToCart) {
            return res.status(404).json({ error: "Product not found." });
        }

        let productPrice 
        
        if(productToCart.discount && productToCart.category.category_discount){

             productPrice = productToCart.discount 
        } else if(!productToCart.discount && productToCart.category.category_discount){
           
          
        productPrice = productToCart.price - (productToCart.price * productToCart.category.category_discount / 100);
        }else{
            productPrice = productToCart.price
           
        }

        
        const totalPrice =   productPrice;

        if (isNaN(totalPrice)) {
            return res.status(400).json({ error: "Invalid total price calculation." });
        }

        let cart = await Cart.findOne({  userid });

        if (cart) {
            const existingProductIndex = cart.products.findIndex(
                (item) => item.productId.toString() === product_id
            );

            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity += 1;
                cart.products[existingProductIndex].totalPrice += totalPrice;
            } else {
                cart.products.push({
                    productId: product_id,
                    quantity: 1,
                    productPrice: productPrice,
                    totalPrice: totalPrice,
                    image: productToCart.image[0],
                });
            }
        } else {
            cart = new Cart({
                userid,
                products: [{
                    productId: product_id,
                    quantity: 1,
                    productPrice: productPrice,
                    totalPrice: productPrice,
                    image: productToCart.image[0],
                }],
                subtotal:0
            });
        }

        await cart.save();
        return res.status(200).json({ message: "Product added to cart successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
}





const removeCart = async (req, res) => {
    
    try {
        
        const userId = req.session.user_id;
        const productId = req.body.productId; // Changed from req.params to req.body
    
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized - User not authenticated" });
        }

        const cart = await Cart.findOne({ userid: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const productIndex = cart.products.findIndex(
            (item) => item.productId.toString() === productId
        ); 
        

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        cart.products.splice(productIndex, 1);
        await cart.save();
     
        let totalPrice = 0;
        cart.products.forEach((item) => {
            totalPrice += item.totalPrice;
        });

        return res.status(200).json({ 
            success: true,
            message: "Product removed from cart successfully",
            totalPrice: totalPrice,
            cartItemCount: cart.products.length
        });
        
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// original 
// const loadCheckout = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
        
//         if (!user_id) {
//             return res.redirect('/');
//         }

//         const user = await User.findById(user_id);
//         const cartData = await Cart.findOne({ userid: user }).populate({
//             path: "products.productId",
//             // model:"products",
//             model: 'Product',
//         });

//         const coupon = await Coupon.find();
//         const wallet = await Wallet.findOne({userId:user});

     
//         const emptyCart = { products: [] };
//         if (req.session.saveCoupon) {
                
        
//             const disCoupon = req.session.couponSave;
//             return res.render("checkout", { user,disCoupon, cartData: cartData || emptyCart ,coupon});
//         }
        
//         res.render("checkout", { user, cartData: cartData || emptyCart ,coupon ,walletBalance: wallet?.balance});
//     } catch (error) {
//         console.log("error from loadCheckout : ", error);
//         res.redirect("/500");
//     }
// }

// const loadCheckout = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
        
//         if (!user_id) {
//             return res.redirect('/');
//         }

//         const user = await User.findById(user_id);
//         const cartData = await Cart.findOne({ userid: user }).populate({
//             path: "products.productId",
//             // model:"products",
//             model: 'Product',
//         });

//         const coupon = await Coupon.find();
//         const wallet = await Wallet.findOne({userId:user});

     
//         const emptyCart = { products: [] };
//         if (req.session.saveCoupon) {
                
        
//             const disCoupon = req.session.couponSave;
//             return res.render("checkout", { user,disCoupon, cartData: cartData || emptyCart ,coupon});
//         }
        
//         res.render("checkout", { user, cartData: cartData || emptyCart ,coupon ,walletBalance: wallet?.balance});
//     } catch (error) {
//         console.log("error from loadCheckout : ", error);
//         res.redirect("/500");
//     }
// }



const loadCheckout = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        
        if (!user_id) {
            return res.redirect('/');
        }

        const user = await User.findById(user_id);
        const cartData = await Cart.findOne({ userid: user }).populate({
            path: "products.productId",
            // model:"products",
            model: 'Product',
        });

        const coupon = await Coupon.find();
        const wallet = await Wallet.findOne({userId:user});

     
        const emptyCart = { products: [] };
        if (req.session.saveCoupon) {
                
        
            const disCoupon = req.session.couponSave;
            return res.render("checkout", { user,disCoupon, cartData: cartData || emptyCart ,coupon});
        }
        
        res.render("checkout", { user, cartData: cartData || emptyCart ,coupon ,walletBalance: wallet?.balance});
    } catch (error) {
        console.log("error from loadCheckout : ", error);
        res.redirect("/500");
    }
}






const loadAddAddress = async(req,res)=>{
    try {
       const  user = req.session.user_id;
        res.render("checkoutAddress",{user});
    } catch (error) {
       res.redirect('/500');
    }
}

const addAddress = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const { name, mobile, pincode, address, city, state } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }
    
        user.address.push({
            name,
            mobile,
            pincode,
            address,
            city,
            state
        });
        const updatedUser = await user.save();
        res.redirect("/checkout");

    } catch (error) {
        console.log("error in addAddress in checkout :",error);
        res.redirect("/500")

        // res.status(500).send('Internal Server Error');
    }
};

// const updateQuantity = async (req, res) => {
//     try {
       
//         const { quantity } = req.body;
//         const { id } = req.params;

//         const user = req.session.user_id;
//         const cartData = await Cart.findOne({ userid: user })

 
        
//         const cartProduct = cartData.products.find(value => value.productId.toString() === id.toString());
        
        
//         if (!cartProduct) {
//             console.log(" products not found");
//             return res.status(404).json({ success: false, message: "Product not found in cart" });
//         } else {
            
//             const newQuantity = Math.max(1, cartProduct.quantity + parseInt(quantity));
//             cartProduct.quantity = newQuantity;
//             // Use productPrice instead of price
//             cartProduct.totalPrice = newQuantity * cartProduct.productPrice;

//             const productPrices = cartData.products.map(product=> product.totalPrice);
//             const subtotal = productPrices.reduce((sum,price) => sum + price , 0);
            
            
            
      
//             cartData.subtotal = subtotal;
//             await cartData.save();
            
//             // res.json({ success: true, message: "Quantity updated successfully" });
//             res.json({ success: true, message: "Quantity updated successfully", subtotal: subtotal });
//         }
//     } catch (error) {
//         console.error("Error updating quantity:", error);
//         res.status(500).json({ success: false, message: "Error updating quantity", error: error.message });
//     }
// };

const updateQuantity = async (req, res) => {
    try {
       
        const { quantity } = req.body;
        const { id } = req.params;

        const user = req.session.user_id;
        const cartData = await Cart.findOne({ userid: user })

 
        
        const cartProduct = cartData.products.find(value => value.productId.toString() === id.toString());
        
        
        if (!cartProduct) {
            console.log(" products not found");
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        } else {
            
            const newQuantity = Math.max(1, cartProduct.quantity + parseInt(quantity));
            cartProduct.quantity = newQuantity;
            // Use productPrice instead of price
            cartProduct.totalPrice = newQuantity * cartProduct.productPrice;

            const productPrices = cartData.products.map(product=> product.totalPrice);
            const subtotal = productPrices.reduce((sum,price) => sum + price , 0);
            
            
            
      
            cartData.subtotal = subtotal;
            await cartData.save();
            
            // res.json({ success: true, message: "Quantity updated successfully" });
            res.json({ success: true,
                 message: "Quantity updated successfully",
                  productId:cartProduct.productId,
                  newQuantity: cartProduct.quantity,
                  newTotalPrice: cartProduct.totalPrice,
                  newSubtotal: subtotal


                 });
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ success: false, message: "Error updating quantity", error: error.message });
    }
};





const DecreaseQty = async(req,res)=>{
   try {
    const { quantity } = req.body;
        const { id } = req.params;

        const user = req.session.user_id;
        const cartData = await Cart.findOne({ userid: user });
        const cartProduct = cartData.products.find(value => value.productId.toString() === id.toString());

        
        if (!cartProduct) {
            console.log(" products not found");
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        } else {
            
            const newQuantity = Math.max(1, cartProduct.quantity + parseInt(quantity));
            cartProduct.quantity = newQuantity;
            
            // Use productPrice instead of price
            cartProduct.totalPrice = newQuantity * cartProduct.productPrice;

            const productPrices = cartData.products.map(product=> product.totalPrice);
            console.log("check the all totals ",productPrices);
            const subtotal = productPrices.reduce((sum,price) => sum + price , 0);
            
            cartData.subtotal = subtotal;
            await cartData.save();
            res.json({ success: true, message: "Quantity updated successfully" });
        }

   } catch (error) {
    
   }
}



const couponSave = async (req, res) => {
    try {
      const { totalPrice, couponCode,discountValue } = req.body; 
      const coupon = await Coupon.findOne({ couponCode }); 
      console.log("totalPrice passed from frndend",totalPrice)
  
      if (coupon) {
        const maxRedeemableAmount = coupon.maxRedeemAmount;
        console.log("req.session.discountedTotal",req.session.discountedTotal);
        const finalDiscountValue = Math.min(discountValue, maxRedeemableAmount);
        const discountedTotal = totalPrice + (discountValue - finalDiscountValue);

        req.session.discountedTotal = totalPrice;
        req.session.appliedCoupon = couponCode;
        req.session.discountValue = discountValue;
        req.session.discountPercentage = coupon.percentage;

        
        // res.json({ success: true, discountedTotal }); // send back updated total
        res.json({ success: true, discountedTotal});
      } else {
        res.json({ success: false, message: 'Invalid coupon code' });
      }
    } catch (error) {
      console.error("Error in coupon save:", error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };




  const removeCoupon = async (req, res) => {
    try {
        req.session.couponSave = null; // Clear the coupon from the session
        req.session.saveCoupon = false;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false });
    }
};



  

module.exports = {
    loadCartPage,
    addToCart,
    removeCart,
    loadCheckout,
    loadAddAddress,
    addAddress, 
    DecreaseQty,
    updateQuantity,
    couponSave,
    removeCoupon,
}