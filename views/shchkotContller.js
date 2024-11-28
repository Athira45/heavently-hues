paymentFailure :async (req, res) => {
    try {
        console.log("Entering payment failure handler");

        const user = req.session.user_id; 
        const { addressId, paymentMethod } = req.body;

        // Fetch cart data and populate products
        const cartData = await Cart.findOne({ userid: user }).populate({
            path: "products.productId",
            model: 'Product',
        });

        if (!cartData || !cartData.products.length) {
            console.log("Cart is empty or not found for user:", user);
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Prepare products array for the order
        const orderProducts = cartData.products.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productPrice,
            quantity: item.quantity,
            total: item.productPrice * item.quantity,
            orderStatus: 'failed'  // Set to "failed" since payment failed
        }));

        // Retrieve discount and final total from session
        const discountValue = req.session.discountValue || 0;
        const discountPercentage = req.session.discountPercentage || 0;
        const finalTotal = req.session.discountedTotal || cartData.subtotal; // Fallback to subtotal if discountedTotal is undefined

        // Calculate total quantity of items
        const totalQuantity = cartData.products.reduce((acc, item) => acc + item.quantity, 0);

        // Set payment status to "failed" since this is a failed payment handler
        const paymentStatus = "failed";

        // Create a new order with the provided data
        const newOrder = new Orders({
            user: user,
            products: orderProducts,
            paymentMode: paymentMethod,
            total: finalTotal,
            totalQuantity: totalQuantity,
            paymentStatus: paymentStatus,
            couponDiscount: discountValue,
            discountPercentage: discountPercentage,
            address: {
                name: addressId.name,
                mobile: addressId.mobile,
                pincode: addressId.pincode,
                address: addressId.address,
                city: addressId.city,
                state: addressId.state,
            },
            date: new Date()
        });          

        // Save the new order to the database
        await newOrder.save();

        // Clear cart products
        cartData.products = [];
        await cartData.save();

        console.log("New Order Created:", newOrder);
        return res.status(200).json({ success: true, newOrder });

    } catch (error) {
        console.error("Error in paymentFailure:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
},

//my code blw
paymentFailure: async(req,res)=>{
        
        try {
            console.log("enter in to payment failure")
           const user = req.session.user_id; 
         const{addressId,paymentMethod} = req.body;
        //  console.log("req.body:",req.body);

    
         const cartData = await Cart.findOne({ userid: user }).populate({
            path: "products.productId",
            model: 'Product',
        });

        if (!cartData || !cartData.products.length) {
            console.log("Cart is empty or not found for user:", user);
            return res.status(400).json({ message: "Cart is empty" });
          }
          

        const orderProducts = cartData.products.map(item => {
            return {
                productId: item.productId._id,
                name: item.productId.name,
                price: item.productPrice,
                quantity: item.quantity,
                total: item.productPrice * item.quantity,
                orderStatus: 'pending'
            };
        });

        const discountValue = req.session.discountValue || 0;
        const discountPercentage = req.session.discountPercentage || 0;
        const discountedTotal = req.session.discountedTotal; // Remove fallback
        const finalTotal = discountedTotal ? discountedTotal : cartData.subtotal;

        const orderTotal = cartData.subtotal || orderProducts.reduce((total,item) => total + item.total,0);
        const totalQuantity = cartData.products.reduce((acc, item) => acc + item.quantity, 0);
        const paymentStatus = (paymentMethod === 'wallet' || paymentMethod === 'Razorpay') ? 'failed' : 'failed';

        const newOrder = new Orders({
            user: user,
            products: orderProducts,
            paymentMode: paymentMethod,
            // total: cartData.subtotal,
            total: finalTotal,
            totalQuantity: totalQuantity,
            paymentStatus: paymentStatus,
            couponDiscount:discountValue,
            discountPercentage:discountPercentage,
            address: {
                name: addressId.name,
                mobile: addressId.mobile,
                pincode: addressId.pincode,
                address: addressId.address,
                city: addressId.city,
                state: addressId.state,
            },
            date: new Date()
        });          
        await newOrder.save();
        cartData.products = [];
        await cartData.save();
         
        console.log("newOrder",newOrder)
        return res.status(200).json({ newOrder });
      

        } catch (error) {
            console.log("error in paymentFailure:",error);
            return res.status(500).json({ success: false, message:'Internal Server Error' });
        }
    },