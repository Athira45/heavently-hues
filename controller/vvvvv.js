const paymentFailure = async (req, res) => {
    // console.log("order id ...... >", req.body)
    try {
      const { order_id, userId } = req.body;
      console.log(req.body, ':::req.body');
  
      // Find the order by order_id
      const order = await Order.findOne({ orderId: order_id});
      console.log('uuuuuu;;;', order);
  
       
      if (order) {
        // Update payment status to 'pending'
        order.paymentStatus = 'pending';
  
        await order.save();
  
        // Optionally, you can send a response back to the client
        return res.json({ success: true, message: 'Payment status updated to pending.' });
      } else {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
  // ------------------------------------------------------------
  const repayment = async(req,res) => {
      // const { orderId } = req.body;
      // console.log('req.body=',req.body);
      const orderId = req.params.orderId;
      console.log('orderId',orderId);
      
  
      try {
      const order = await Order.findById(orderId);
      console.log('order hkjgjkg',order);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, message: 'Order is already paid' });
      }
      // / If payment is pending, create a new Razorpay order
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: order.total * 100, // amount in paise
        currency: 'INR',
        receipt: order_${order._id},
        payment_capture: 1 // Auto capture
      });
  
      // Update the order with the new Razorpay order ID and increment payment attempts
      order.razorpayOrderId = razorpayOrder.id;
      order.paymentAttempts += 1;
      await order.save();
  
       // Send the Razorpay key and required details to frontend
       res.json({
        amount: order.total * 100, // Amount in paise
        currency: "INR",
        orderId: order._id, // Your order ID
        name: "Your Store Name",
        success: true,
        order, razorpayOrderId: razorpayOrder.id
        // razorpayKey: process.env.RAZORPAY_KEY_ID,
        // order
      });
    } catch (error) {
      console.error('Error initiating repayment:', error);
      res.status(500).json({ success: false, message: 'Failed to initiate repayment' });
    }
  }
  // ------------------------------------------------------------------------
  const verifyRepayment =async(req,res) => {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature,orderId } = req.body;
  console.log('req.body',req.body);
  
    console.log('razorpayOrderId....??', razorpayOrderId);
    // Find the existing order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      const secret = process.env.RAZORPAY_SECRET_KEY;
      const body = ${razorpayOrderId}|${razorpayPaymentId};
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    
  console.log('expectedSignature',expectedSignature);
  
    if (expectedSignature === razorpaySignature) {
      try {
     // Update order payment status to 'Paid'
  order.paymentStatus = 'paid';
  // order.razorpay = { paymentId, razorpayOrderId, signature };
  
  await order.save();
  
  res.json({ success: true, message: 'Payment verified successfully!' });
  }catch (err) {
  console.error('Failed to update order:', err);
  res.status(500).json({ message: 'Failed to update order status' });
  }
  } else {
  res.status(400).json({ message: 'Payment verification failed' });
  }
  }
  const paymentFailed = async(req,res) => {
    res.render('paymentFailed');
  }


  
//////////////////////////////////////////////ordercontroller////////////////////////////////////////////////////////////////////////////////////////

const User = require('../models/userModel');
const Products = require('../models/productModel');
const mongoose = require('mongoose');
const path = require('path');
const Orders = require('../models/orderModel');
const Cart=require('../models/cartModel')
const crypto = require("crypto");
const Razorpay = require('razorpay');
const Wallet = require('../models/walletModel');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');




 

module.exports = {
   

    creatingorder: async (req, res) => {
        try {
            const { paymentMethod, selectedValue } = req.body;

            // Assuming you have products in the session or coming from the frontend
            const user = req.session.user_id;
            const cartData = await Cart.findOne({ userid: user }).populate({
                path: "products.productId",
                model: 'Product',
            })
            // console.log('cart',cartData)
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
    // console.log('cartproducts',orderProducts)

    const orderTotal = cartData.subtotal || orderProducts.reduce((total,item) => total + item.total,0);
    const totalQuantity = cartData.products.reduce((acc, item) => acc + item.quantity, 0);
    if(paymentMethod === 'Cash on delivery' && orderTotal > 1000){
        return res.status(400).json({message: "Orders above Rs 1000 are not allowed for Cash on Delivery (COD). "})
    }
    
    
    const discountValue = req.session.discountValue || 0;
    const discountPercentage = req.session.discountPercentage || 0;
    const discountedTotal = req.session.discountedTotal; // Remove fallback
    const finalTotal = discountedTotal ? discountedTotal : cartData.subtotal;


    console.log("discountedTotal",discountedTotal);
    console.log("discountPercentage",discountPercentage);

    const paymentStatus = (paymentMethod === 'wallet' || paymentMethod === 'Razorpay') ? 'paid' : 'pending';
            // Create a new order
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
                    name: selectedValue.name,
                    mobile: selectedValue.mobile,
                    pincode: selectedValue.pincode,
                    address: selectedValue.address,
                    city: selectedValue.city,
                    state: selectedValue.state,
                },
                date: new Date()
            });          
            await newOrder.save();
            cartData.products = [];
            await cartData.save();

            // changes 
            if(paymentMethod === 'wallet'){
                const walletData =  await Wallet.findOne({userId:user});
                if(!walletData){
                    return res.status(400).json({ message: "No wallet found for the user" }); 
                }

                if (walletData.balance < cartData.subtotal) {
                    return res.status(400).json({ message: "Insufficient wallet balance" });
                }

                walletData.balance -= cartData.subtotal;
                // Add a debit transaction
                walletData.transactions.push({
                    transaction_id: `TXN${Date.now()}`,
                    amount:cartData.subtotal,
                    type:"debit",
                    description: "Order payment",
                    orderId: newOrder._id,

                });
                // Save the updated wallet data
            await walletData.save();
            }
            // ..........

           
            res.status(201).json({success:true, message: "Order created successfully", order: newOrder });
        } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).json({ message: "Failed to create order", error });
        }
    },


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

        return res.status(200).json({ newOrder });
      

        } catch (error) {
            console.log("error in paymentFailure:",error);
            return res.status(500).json({ success: false, message:'Internal Server Error' });
        }
    },

//  repayment : async (res,req)=>{
//         const orderId = req.params.orderId;
//         console.log("orderId:",orderId)
//        try {       
//          const order = await Orders.findById(orderId);
//        } catch (error) {
//         console.log("errorn in repayment",error);
        
//        }
//     },


    RenderSuccesPage:(req,res)=>{
        
   res.render('successpage');
    },

  

//user side
    orderDetailsPage: async (req,res)=>{
        try {
            const user = req.session.user_id;
            const orderId = req.query.orderId;
            const userName = await User.findOne({_id:user});
            const orders = await Orders.find({_id:orderId}) .populate ({
                path: "products.productId",
                model: "Product",
            })
               
           
            res.render('orderDetails',{user,orders,orderId});
        } catch (error) {
            console.log("error from orderDetails :",error);
            res.redirect('/500');
        }


},



cancelOrPlaceOrder :async(req,res)=>{
    try {
        const user = req.session.user_id;
        const orderId = req.params.orderId;
        const productId = req.params.productId
        console.log("nnnnnnnnn,",productId);

        const updateOrder = await Orders.updateOne({
            _id:orderId,
            'products._id' :productId
        },
     {
        $set: {
            'products.$.orderStatus': ' cancelled',
        }
     })


    const productPrice = await Products.findOne({_id: productId});//products
        // console.log("productPrice", productPrice);

        // Fetch the user's wallet
        let wallet = await Wallet.findOne({userId: user});

        // Generate a unique transaction ID
        const transactionId = uuidv4();  

        if (!wallet) {
            
            // Create a new wallet for the user if none exists
            wallet = await Wallet.create({
                userId: user,
                balance: productPrice.price,
                transactions: [{
                    transaction_id: uuidv4(),  // Assign the generated transaction ID
                    amount: productPrice.price,
                    type: "credit",
                    description: "Cancel Amount",
                    orderId: orderId,
                    product: productId,
                }]
            });
            await wallet.save();
        } else {
            // If wallet exists, update it with the new transaction
            wallet.balance += productPrice.price;
            wallet.transactions.push({
                transaction_id: uuidv4(),  // Assign the generated transaction ID
                amount: productPrice.price,
                type: "credit",
                description: "Cancel Amount",
                orderId: orderId,
                product: productId,
            });
            await wallet.save();
        }

     res.json({
        success:true,
        message:"Product cancelled successfully",
        updateOrder,
     })
   

    } catch (error) {
        res.redirect("/500");
        console.log("errorr in cancel",error)
        // res.status(500).json({success: false, message: "Internal server error"});
    }
},

//admin
loadOrder:async(req,res)=>{
    try {
        const admin = req.session.admin;
       
        const totalorder = await Orders.countDocuments();
        const allOrders =  await Orders.find().sort({date:-1})
        .populate ({
            path: "products.productId",
            model: "Product",
        })
        .populate('user','name')
       
       
        res.render("orders",{allOrders})
        
    } catch (error) {
        console.log("error in loadOrder function :", error);
        res.redirect('/500');

    }
},


itemDetails: async (req, res) => {
    try {
        const { orderId, itemId  } = req.params;
        const order = await Orders.findById(orderId)
            // .populate({
            //     path: 'products.productId',
            //     model: 'Products'  
            // });
        
        
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
        // Find the specific item in the order's products array
        const item = order.products.find(product => product._id.toString() === itemId);
        
        // if (!item) {
        //     return res.status(404).send('Item not found in the order');
        // }
        
        res.render('itemDetails', { order, item });
    } catch (error) {
        console.log("Error in itemDetails:", error);
        res.redirect('/500');
    }
},

   statusUpdate: async (req, res) => {
    try {
        const { orderId, selectedStatus, userId } = req.body;
        console.log("req body: ", req.body);

       

        const result = await Orders.updateOne(
            { _id: orderId, user: userId, "products.productId": { $exists: true } },
            { $set: { "products.$[].orderStatus": selectedStatus } }
        );

        
        

        if (result.modifiedCount > 0) {
            // res.status(200).json({ message: "Order status updated successfully" });
            
            
            res.json({success:true})
        } else {
            res.status(404).json({ message: "Order not found or no changes made" });
        }

    } catch (error) {
        console.log("error in status update :", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
},

getKey: async(req,res)=>{
   return res.status(200).json({key:process.env.RAZORPAY_ID_KEY})
},

 createRazerPayOrder : async (req, res) => {
    try {
        const { amount } = req.body;
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_ID_KEY,
            key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        
        
        // console.log('amount',amount)
        const orderAmount = amount

        const options = {
            amount: orderAmount*100,
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log("Razorpay order creation error:", error);
                return res.status(400).json({ error: error.message });
            }
            res.status(200).json({ orderId: order.id, order });
        });
    } catch (error) {
        console.log("Error in createRazerPayOrder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
},

orderReturn: async (req, res) => {
    try {
        console.log("entere orderRetuern");
      const { orderId, productId } = req.params;
      const { returnReason } = req.body;
      console.log("reassssssssssson:",returnReason);
      console.log("orderId, prodectId :",orderId, productId)
  
    //   const orderData = await Orders.findOne({ _id: orderId, "products._id": productId });
      const orderData = await Orders.findOne({ 
        _id: new mongoose.Types.ObjectId(orderId), 
        "products.productId": new mongoose.Types.ObjectId(productId) 
      });
    //   console.log("orderdata:",orderData)
      if (!orderData) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      // Update the specific product in the order with the return status and reason
      const product = orderData.products.find((p) => p._id.toString() === productId);
    //   console.log("productttt:",product)
      if (product) {
        product.orderStatus = 'Return Requested';
        product.returnReason = returnReason;  // Store the return reason
        await orderData.save();
      }
  
      res.json({ success: true });
    } catch (error) {
      console.log("Error in orderReturn:", error);
      res.status(500).json({ success: false, message: "Error processing return request" });
    }
  },
  
//handle returnreq

returnReq: async(req,res)=>{
    try {
        const user = req.session.user_id;

        const{selectedValue,orderId,productId} = req.body;
        const orderData = await Orders.findOne({_id:orderId})
        
        orderData.returnStatus=selectedValue
        orderData.save()
        
        console.log("ppppp",productId)

        const productPrice = await Products.findOne({_id: productId});
        let wallet = await Wallet.findOne({userId: user});
        const transactionId = uuidv4();  
        if (!wallet) {
            
            // Create a new wallet for the user if none exists
            wallet = await Wallet.create({
                userId: user,
                balance: productPrice.price,
                transactions: [{
                    transaction_id: uuidv4(),  // Assign the generated transaction ID
                    amount: productPrice.price,
                    type: "credit",
                    description: "Cancel Amount",
                    orderId: orderId,
                    product: productId,
                }]
            });
            await wallet.save();
        } else {
            // If wallet exists, update it with the new transaction
            wallet.balance += productPrice.price;
            wallet.transactions.push({
                transaction_id: uuidv4(),  // Assign the generated transaction ID
                amount: productPrice.price,
                type: "credit",
                description: "return Amount",
                orderId: orderId,
                product: productId,
            });
            await wallet.save();
        }
 
    
        res.json({success:true})

    } catch (error) {
        console.log("error in returnReqst",error);
    }
},




generateInvoicePDF: async (order) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        let buffers = [];

        // Collect PDF data into buffers
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // Handle errors
        doc.on('error', reject);

        // Document Title
        doc.fontSize(21).text("Heavenly Hues", { align: 'center' });
        doc.fontSize(20).text("Invoice", { align: 'center' });
        doc.moveDown();

        // Customer and Order Details
        doc.fontSize(12).text(`Order Id: ${order._id}`, { align: 'left' });
        doc.text(`Order Date: ${order.date.toDateString()}`);
        doc.fontSize(12).text(`Customer Name: ${order.address.name}`, { align: 'left' });
        doc.fontSize(12).text(`Payment Status: ${order.paymentStatus}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(12).text("Shipping Address:", { underline: true, align: 'left' });
        doc.moveDown(0.5);
        doc.text(`${order.address.name}`, { align: 'left' });
        doc.text(`${order.address.address}`, { align: 'left' });
        doc.text(`${order.address.state}`, { align: 'left' });
        doc.text(`${order.address.pincode}`, { align: 'left' });
        doc.moveDown(0.5);

        doc.fontSize(12).text("Order Items:", { underline: true, align: 'left' });
        doc.moveDown(0.5);

        // Define starting Y position for the table
        const tableTop = doc.y;
        const itemSpacing = 20;

        // Draw Table Headers
        doc.fontSize(12).text("Product Name", 50, tableTop, { bold: true });
        doc.text("Price", 250, tableTop);
        doc.text("Quantity", 350, tableTop);
        doc.text("Total", 450, tableTop);

        // Draw header line
        doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        // Table rows for each product
        let currentY = tableTop + itemSpacing;
        let subtotal = 0;
        let totalDiscount = 0; // Initialize total discount

        order.products.forEach((item) => {
            const product = item.productId;
            const price = item.price;
            const quantity = item.quantity;
            let total = price * quantity;
            subtotal += total;

            // Determine which discount to apply
            let itemDiscount = 0;
            if (product.offer) {
                // Apply the fixed product offer amount if present
                itemDiscount = product.offer * quantity;
            } else if (product.category && product.category.category_discount) {
                // Otherwise, apply the category discount as a percentage
                itemDiscount = ((price * product.category.category_discount) / 100) * quantity;
            }
            totalDiscount += itemDiscount;

            doc.fontSize(10).text(product.name, 50, currentY);
            doc.text(price.toFixed(2), 250, currentY);
            doc.text(quantity, 350, currentY);
            doc.text((total - itemDiscount).toFixed(2), 450, currentY); // Total after discount

            // Move Y position for the next row
            currentY += itemSpacing;
        });

        // Draw subtotal and total line
        doc.moveTo(50, currentY + 10).lineTo(500, currentY + 10).stroke();

        // Add subtotal
        currentY += 30;
        doc.fontSize(12).text(`Subtotal :`, 350, currentY);
        doc.text(subtotal.toFixed(2), 450, currentY);

        currentY += 20;
        doc.fontSize(12).text(`Discount :`, 350, currentY);
        doc.text(`-${totalDiscount.toFixed(2)}`, 450, currentY); // Display the total discount

        currentY += 30;
        doc.fontSize(12).text(`TOTAL :`, 350, currentY);
        const totalAfterDiscount = subtotal - totalDiscount;
        doc.text(totalAfterDiscount.toFixed(2), 450, currentY); // Display the total amount after discounts

        // Finalize the PDF
        doc.end();
    });
},


generateOrderInvoice: async (req, res) => {
    try {
        const { id } = req.params;
        let find = {};

        if (mongoose.Types.ObjectId.isValid(id)) {
            find._id = id;
        } else {
            find.orderId = id;
        }

        // Find the order and populate product details
        // const order = await Orders.findOne(find).populate({
        //     path: "products.productId",
        //     model: "Product",
        // });

        const order = await Orders.findOne(find).populate({
            path: 'products.productId',
            model: 'Product',
            populate: {
                path: 'category', // Populate the category field within the product
                model: 'Categories'
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Generate PDF as a buffer
        const pdfBuffer = await module.exports.generateInvoicePDF(order);

        // Set headers to send the PDF as a download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

        // Send the generated PDF buffer as the response
        res.status(200).end(pdfBuffer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}






}



