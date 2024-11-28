const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            default: 'pending',
            enum: [ 'pending','shipped', 'Delivered', 'request return', 'returned', 'request cancellation', ' cancelled']
        }
    }],
    paymentMode: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        default: "pending",
        enum: ["pending", "paid", "failed"]
    },

    returnStatus: {
        type: String,
        default: "pending",
        enum: ["pending", "rejected", "accepted","requested"]
    },
    couponDiscount:{
        type : Number,
        required: false
    },
    discountPercentage:{
        type:Number,
        required:false
    },
    //total qty of all products
    totalQuantity: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    address: {
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: Number,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    }
}, { timestamps: true });

const Orders = mongoose.model('orders', orderSchema);
module.exports = Orders;


//order controller

 // creatingorder: async (req, res) => {
    //     try {
    //         const { paymentMethod, selectedValue } = req.body;

    //         // Assuming you have products in the session or coming from the frontend
    //         const user = req.session.user_id;
    //         const cartData = await Cart.findOne({ userid: user }).populate({
    //             path: "products.productId",
    //             model: 'Product',
    //         })
    //         // console.log('cart',cartData)
    //         const orderProducts = cartData.products.map(item => {
    //             return {
    //                 productId: item.productId._id,
    //                 name: item.productId.name,
    //                 price: item.productPrice,
    //                 quantity: item.quantity,
    //                 total: item.productPrice * item.quantity,
    //                 orderStatus: 'pending'
    //             };
    //         });
    // // console.log('cartproducts',orderProducts)

    // const orderTotal = cartData.subtotal || orderProducts.reduce((total,item) => total + item.total,0);
    
    // if(paymentMethod === 'Cash on delivery' && orderTotal > 1000){
    //     return res.status(400).json({message: "Orders above Rs 1000 are not allowed for Cash on Delivery (COD). "})
    // }
    //         // Create a new order
    //         const newOrder = new Orders({
    //             user: user,
    //             products: orderProducts,
    //              paymentMode: paymentMethod,
    //             total: cartData.subtotal,
    //             address: {
    //                 name: selectedValue.name,
    //                 mobile: selectedValue.mobile,
    //                 pincode: selectedValue.pincode,
    //                 address: selectedValue.address,
    //                 city: selectedValue.city,
    //                 state: selectedValue.state,
    //             },
    //             date: new Date()
    //         });          
    //         await newOrder.save();
    //         cartData.products = [];
    //         await cartData.save();

    //         // changes 
    //         if(paymentMethod === 'wallet'){
    //             const walletData =  await Wallet.findOne({userId:user});
    //             if(!walletData){
    //                 return res.status(400).json({ message: "No wallet found for the user" }); 
    //             }

    //             if (walletData.balance < cartData.subtotal) {
    //                 return res.status(400).json({ message: "Insufficient wallet balance" });
    //             }

    //             walletData.balance -= cartData.subtotal;
    //             // Add a debit transaction
    //             walletData.transactions.push({
    //                 transaction_id: `TXN${Date.now()}`,
    //                 amount:cartData.subtotal,
    //                 type:"debit",
    //                 description: "Order payment",
    //                 orderId: newOrder._id,

    //             });
    //             // Save the updated wallet data
    //         await walletData.save();
    //         }
    //         // ..........

           
    //         res.status(201).json({success:true, message: "Order created successfully", order: newOrder });
    //     } catch (error) {
    //         console.error("Error creating order:", error);
    //         res.status(500).json({ message: "Failed to create order", error });
    //     }
    // },


    // creatingorder: async (req, res) => {
    //     try {
    //         const { paymentMethod, selectedValue } = req.body;

    //         // Assuming you have products in the session or coming from the frontend
    //         const user = req.session.user_id;
    //         const cartData = await Cart.findOne({ userid: user }).populate({
    //             path: "products.productId",
    //             model: 'Product',
    //         })
    //         // console.log('cart',cartData)
    //         const orderProducts = cartData.products.map(item => {
    //             return {
    //                 productId: item.productId._id,
    //                 name: item.productId.name,
    //                 price: item.productPrice,
    //                 quantity: item.quantity,
    //                 total: item.productPrice * item.quantity,
    //                 orderStatus: 'pending'
    //             };
    //         });
    // // console.log('cartproducts',orderProducts)

    // const orderTotal = cartData.subtotal || orderProducts.reduce((total,item) => total + item.total,0);
    // const totalQuantity = cartData.products.reduce((acc, item) => acc + item.quantity, 0);
    // if(paymentMethod === 'Cash on delivery' && orderTotal > 1000){
    //     return res.status(400).json({message: "Orders above Rs 1000 are not allowed for Cash on Delivery (COD). "})
    // }
    //         // Create a new order
    //         const newOrder = new Orders({
    //             user: user,
    //             products: orderProducts,
    //              paymentMode: paymentMethod,
    //             total: cartData.subtotal,
    //             totalQuantity: totalQuantity,
    //             address: {
    //                 name: selectedValue.name,
    //                 mobile: selectedValue.mobile,
    //                 pincode: selectedValue.pincode,
    //                 address: selectedValue.address,
    //                 city: selectedValue.city,
    //                 state: selectedValue.state,
    //             },
    //             date: new Date()
    //         });          
    //         await newOrder.save();
    //         cartData.products = [];
    //         await cartData.save();

    //         // changes 
    //         if(paymentMethod === 'wallet'){
    //             const walletData =  await Wallet.findOne({userId:user});
    //             if(!walletData){
    //                 return res.status(400).json({ message: "No wallet found for the user" }); 
    //             }

    //             if (walletData.balance < cartData.subtotal) {
    //                 return res.status(400).json({ message: "Insufficient wallet balance" });
    //             }

    //             walletData.balance -= cartData.subtotal;
    //             // Add a debit transaction
    //             walletData.transactions.push({
    //                 transaction_id: `TXN${Date.now()}`,
    //                 amount:cartData.subtotal,
    //                 type:"debit",
    //                 description: "Order payment",
    //                 orderId: newOrder._id,

    //             });
    //             // Save the updated wallet data
    //         await walletData.save();
    //         }
    //         // ..........

           
    //         res.status(201).json({success:true, message: "Order created successfully", order: newOrder });
    //     } catch (error) {
    //         console.error("Error creating order:", error);
    //         res.status(500).json({ message: "Failed to create order", error });
    //     }
    // },


//401
// createRazerPayOrder: async(req,res)=>{
//     try {
//         const {amount} = req.body;

//         const instance = new Razorpay({
//             key_id:process.env.RAZORPAY_ID_KEY,
//             key_secret:process.env.RAZORPAY_SECRET_KEY,
//         });

//        const options = {
//          amount: amount * 100,
//          currency :"INR",
//          receipt : crypto.randomBytes(10).toString("hex"),
//        };

//        instance.orders.create(options, (error,order)=>{
//         if(error) {
//             console.log(error);
//             throw Error(error);
//         }
//         res.status(200).json({orderId: order.id, order});
//        });
//     } catch (error) {
//         console.log("error in createRazerPayOrder:",error);
//         res.status(400).json({ error: error.message });
//     }
// }



//435
// verifyPayment: async(req,res)=>{
//     try {
//         const userid = req.session.user_id;
//         const {payment,order} = req.body;
//         const orderId = order.order.receipt;

//         const secret = process.env.RAZORPAY_ID_KEY;
//         let hmac = Crypto.createHmac('sha256',secret);  // (Hash-based Message Authentication Code) ,  sha256(Secure Hash Algorithm 256-bit)
//         hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
//         hmac = hmac.digest('hex');

//         if(hmac === payment.razorpay_signature) {
//             const order = await Orders.findById(orderId);
//             if(order) {
//                 order.paymentStatus = "Razorpay";
//                 await order.save();
//             }

//             const cart = await Cart.findOne({userid:userid});
//             if(cart && cart.products && cart.products.length > 0) {
//                 for (let i = 0; i < cart.products.length; i++) {
//                     const productId = cart.products[i].quantity;

//                     await Products.updateOne(
//                         {_id:productId},
//                         {
//                             $inc: {
//                                 quantity:-count
//                             }
//                         }
//                     );
//                 }
//             }
       
//     await Cart.deleteOne({userid});
//     res.json({payment:true});

// }
//     } catch (error) {
//         console.log("error in verifyPayment : ",error);
//         res.redirect('/500');
//     }
// }



//573

// // Assuming generateInvoicePDF is defined in the same file
// generateInvoicePDF : async (order) => {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         let buffers = [];

//         // Collect PDF data into buffers
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => {
//             const pdfData = Buffer.concat(buffers);
//             resolve(pdfData);
//         });

//         // Handle errors
//         doc.on('error', reject);

//         // Example content for the PDF
//         doc.fontSize(25).text(`Invoice for Order ID: ${order._id}`, { align: 'center' });
//         doc.fontSize(12).text(`Customer Name: ${order.customerName}`, { align: 'left' });
//         doc.text(`Order Date: ${order.orderDate}`);

//         // Add products from the order
//         order.products.forEach((item, index) => {
//             doc.text(`Product ${index + 1}: ${item.productId.name}`);
//             doc.text(`Price: ${item.price}`);
//             doc.text(`Quantity: ${item.quantity}`);
//         });

//         // Finalize the PDF
//         doc.end();
//     });
// },


// generateOrderInvoice :async(req,res)=>{
//     try {
//         const {id} = req.params;
//         let find = {};

//         if (mongoose.Types.ObjectId.isValid(id)) {
//             find._id = id;
//           } else {
//             find.orderId = id;
//           }

//           const order = await Orders.findOne(find).populate ({
//             path: "products.productId",
//             model: "Product",
//         })

//         const pdfBuffer = await generateInvoicePDF(order);
//         // Set headers for the response
//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
//         res.status(200).end(pdfBuffer);

//     } catch (error) {
//         res.status(400).json({ error: error.message });
        
//     }
// }


// Define generateInvoicePDF function
// generateInvoicePDF: async (order) => {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         let buffers = [];

//         // Collect PDF data into buffers
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => {
//             const pdfData = Buffer.concat(buffers);
//             resolve(pdfData);
//         });

//         // Handle errors
//         doc.on('error', reject);

//         // Example content for the PDF
//         doc.fontSize(25).text(`Invoice for Order ID: ${order._id}`, { align: 'center' });
//         doc.fontSize(12).text(`Customer Name: ${order.address.name}`, { align: 'left' });
//         doc.text(`Order Date: ${order.date.toDateString()}`);

//         // Add products from the order
//         order.products.forEach((item, index) => {
//             doc.text(`Product ${index + 1}: ${item.productId.name}`);
//             doc.text(`Price: ${item.price}`);
//             doc.text(`Quantity: ${item.quantity}`);
//         });

//         // Finalize the PDF
//         doc.end();
//     });
// },

// generateInvoicePDF: async (order) => {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         let buffers = [];

//         // Collect PDF data into buffers
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => {
//             const pdfData = Buffer.concat(buffers);
//             resolve(pdfData);
//         });

//         // Handle errors
//         doc.on('error', reject);

//         // Document Title
//         doc.fontSize(21).text("Heavently Hues", { align: 'center' });
//         doc.fontSize(20).text("Invoice", { align: 'center' });
//         doc.moveDown();

//         // Customer and Order Details
//         doc.fontSize(12).text(`Order Id: ${order._id}`, { align: 'left' });
//         doc.text(`Order Date: ${order.date.toDateString()}`);
//         doc.fontSize(12).text(`Customer Name: ${order.address.name}`, { align: 'left' });
//         doc.fontSize(12).text(`payment Status: ${order.paymentStatus}`, { align: 'left' });
//         doc.moveDown();

//         doc.fontSize(12).text("Shipping Address:", { underline: true, align: 'left' });
//         doc.moveDown(0.5);
//         doc.text(`${order.address.name}`, { align: 'left' });
//         doc.text(`${order.address.address}`, { align: 'left' });
//         doc.text(`${order.address.state}`, { align: 'left' });
//         doc.text(`${order.address.pincode}`, { align: 'left' });
//         doc.moveDown(0.5);

//         doc.fontSize(12).text("Order Items:", { underline: true, align: 'left' });
//         doc.moveDown(0.5);
       
//         // Define starting Y position for the table
//         const tableTop = doc.y;
//         const itemSpacing = 20;

//         // Draw Table Headers
//         doc.fontSize(12).text("Product Name", 50, tableTop, { bold: true });
//         doc.text("Price", 250, tableTop);
//         doc.text("Quantity", 350, tableTop);
//         doc.text("Total", 450, tableTop);

//         // Draw header line
//         doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

//         // Table rows for each product
//         let currentY = tableTop + itemSpacing;
//         let subtotal = 0;

//         order.products.forEach((item) => {
//             const product = item.productId;
//             const price = item.price;
//             const quantity = item.quantity;
//             const total = price * quantity;
//             subtotal += total;

//             doc.fontSize(10).text(product.name, 50, currentY);
//             doc.text(price.toFixed(2), 250, currentY);
//             doc.text(quantity, 350, currentY);
//             doc.text(total.toFixed(2), 450, currentY);

//             // Move Y position for the next row
//             currentY += itemSpacing;
//         });

//         // Draw subtotal and total line
//         doc.moveTo(50, currentY + 10).lineTo(500, currentY + 10).stroke();

//         // Add subtotal
       
// // Add Subtotal
// currentY += 30;
// doc.fontSize(12).text(`Subtotal :`, 350, currentY);
// doc.text(subtotal.toFixed(2), 450, currentY);

// currentY += 20; // Adjust spacing as needed
// doc.fontSize(12).text(`Coupon Discount :`, 350, currentY);
// if (couponDiscount) {
//     doc.text(`-${couponDiscount.toFixed(2)}`, 450, currentY); // Display the coupon discount
// }



// currentY += 20;
// doc.fontSize(12).text(`Offer Discount :`, 350, currentY);
// // doc.text(offerDiscount.toFixed(2), 450, currentY);

// currentY += 30;
// doc.fontSize(12).text(`TOTAL :`, 350, currentY);
//         doc.text(total.toFixed(2), 450, currentY); // Display the total amount

//         // Finalize the PDF
//         doc.end();
//     });
// }

// generateInvoicePDF: async (order) => {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         let buffers = [];

//         // Collect PDF data into buffers
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => {
//             const pdfData = Buffer.concat(buffers);
//             resolve(pdfData);
//         });

//         // Handle errors
//         doc.on('error', reject);

//         // Destructure discount and total values from the order object
//         const { couponDiscount = 0, discountPercentage = 0, total } = order;

//         // Document Title
//         doc.fontSize(21).text("Heavenly Hues", { align: 'center' });
//         doc.fontSize(20).text("Invoice", { align: 'center' });
//         doc.moveDown();

//         // Customer and Order Details
//         doc.fontSize(12).text(`Order Id: ${order._id}`, { align: 'left' });
//         doc.text(`Order Date: ${order.date.toDateString()}`);
//         doc.fontSize(12).text(`Customer Name: ${order.address.name}`, { align: 'left' });
//         doc.fontSize(12).text(`Payment Status: ${order.paymentStatus}`, { align: 'left' });
//         doc.moveDown();

//         doc.fontSize(12).text("Shipping Address:", { underline: true, align: 'left' });
//         doc.moveDown(0.5);
//         doc.text(`${order.address.name}`, { align: 'left' });
//         doc.text(`${order.address.address}`, { align: 'left' });
//         doc.text(`${order.address.state}`, { align: 'left' });
//         doc.text(`${order.address.pincode}`, { align: 'left' });
//         doc.moveDown(0.5);

//         doc.fontSize(12).text("Order Items:", { underline: true, align: 'left' });
//         doc.moveDown(0.5);

//         // Define starting Y position for the table
//         const tableTop = doc.y;
//         const itemSpacing = 20;

//         // Draw Table Headers
//         doc.fontSize(12).text("Product Name", 50, tableTop, { bold: true });
//         doc.text("Price", 250, tableTop);
//         doc.text("Quantity", 350, tableTop);
//         doc.text("Total", 450, tableTop);

//         // Draw header line
//         doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

//         // Table rows for each product
//         let currentY = tableTop + itemSpacing;
//         let subtotal = 0;

//         order.products.forEach((item) => {
//             const product = item.productId;
//             const price = item.price;
//             const quantity = item.quantity;
//             const total = price * quantity;
//             subtotal += total;

//             doc.fontSize(10).text(product.name, 50, currentY);
//             doc.text(price.toFixed(2), 250, currentY);
//             doc.text(quantity, 350, currentY);
//             doc.text(total.toFixed(2), 450, currentY);

//             // Move Y position for the next row
//             currentY += itemSpacing;
//         });

//         // Draw subtotal and total line
//         doc.moveTo(50, currentY + 10).lineTo(500, currentY + 10).stroke();

//         // Add Subtotal
//         currentY += 30;
//         doc.fontSize(12).text(`Subtotal :`, 350, currentY);
//         doc.text(subtotal.toFixed(2), 450, currentY);

//         currentY += 20; // Adjust spacing as needed
//         doc.fontSize(12).text(`Coupon Discount :`, 350, currentY);
//         if (couponDiscount) {
//             doc.text(`${couponDiscount.toFixed(2)}`, 450, currentY); // Display the coupon discount
//         }

//         currentY += 20;
//         doc.fontSize(12).text(`Offer Discount :`, 350, currentY);
//         doc.text(`${totalOfferDiscount.toFixed(2)}`, 450, currentY);


//         currentY += 30;
//         doc.fontSize(12).text(`TOTAL :`, 350, currentY);
//         doc.text(total.toFixed(2), 450, currentY); // Display the total amount

//         // Finalize the PDF
//         doc.end();
//     });
// }

// 727

//      generateOrderInvoice : async (order) => {
//         const doc = new PDFDocument();
    
//         let buffers = [];
//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => { });
    
//         // Invoice Title
//         doc.fontSize(20).text('INVOICE', { align: 'center' });
    
//         // Order Information
//         doc.fontSize(12).text(`Order ID: ${order.orderId}`, { align: 'left' });
//         doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);
//         doc.text(`Payment Method: ${order.paymentMethod}`);
//         doc.text(`Payment Status: ${order.paymentStatus}`);
    
//   // Shipping Address
// doc.moveDown();
// doc.fontSize(14).text('Shipping Address:', { underline: true });
// doc.fontSize(12).text(`${order.address.name}`);
// doc.text(`${order.address.address}, ${order.address.city}`);
// doc.text(`${order.address.state}, ${order.address.pincode}`);
// doc.text(`${order.address.country}`); // Make sure to add this field in your schema if it's not there.


    
//         // Order Items Table
//         doc.moveDown();
//         doc.fontSize(14).text('Order Items:', { underline: true });
    
//         const tableTop = doc.y + 20;
//         const itemColumn = 50;
//         const qtyColumn = 200;
//         const priceColumn = 280;
//         const totalColumn = 360;
    
//         doc.fontSize(12);
//         doc.text('Item', itemColumn, tableTop);
//         doc.text('Qty', qtyColumn, tableTop);
//         doc.text('Price', priceColumn, tableTop);
//         doc.text('Total', totalColumn, tableTop);
    
//         let yPosition = tableTop + 20;
//         order.products.forEach((product) => {
//             doc.text(product.productId.name, itemColumn, yPosition);
//             doc.text(product.quantity, qtyColumn, yPosition);
//             doc.text(`₹${product.productId.price.toFixed(2)}`, priceColumn, yPosition);
//             doc.text(`₹${(product.productId.price * product.quantity).toFixed(2)}`, totalColumn, yPosition);
//             yPosition += 20;
//         });
    
//         // Summary
//         doc.moveDown();
//         doc.text(`Subtotal: ₹${order.subtotal.toFixed(2)}`, { align: 'right' });
//         doc.text(`Shipping: ₹${order.shippingCost.toFixed(2)}`, { align: 'right' });
//         doc.text(`Coupon Discount: ₹${order.couponDiscount.toFixed(2)}`, { align: 'right' });
//         doc.text(`Offer Discount: ₹${order.offerDiscount.toFixed(2)}`, { align: 'right' });
    
//         // Total
//         doc.moveDown();
//         doc.fontSize(14).text(`Total: ₹${order.total.toFixed(2)}`, { align: 'right', bold: true });
    
//         // End and generate buffer
//         doc.end();
//         const pdfBuffer = Buffer.concat(buffers);
//         return pdfBuffer;
//     }


// 435

// verifyPayment: async(req,res)=>{
//     try {
//         const userid = req.session.user_id;
//         const {payment,order} = req.body;
//         const orderId = order.order.receipt;

//         const secret = process.env.RAZORPAY_ID_KEY;
//         let hmac = Crypto.createHmac('sha256',secret);  // (Hash-based Message Authentication Code) ,  sha256(Secure Hash Algorithm 256-bit)
//         hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
//         hmac = hmac.digest('hex');

//         if(hmac === payment.razorpay_signature) {
//             const order = await Orders.findById(orderId);
//             if(order) {
//                 order.paymentStatus = "Razorpay";
//                 await order.save();
//             }

//             const cart = await Cart.findOne({userid:userid});
//             if(cart && cart.products && cart.products.length > 0) {
//                 for (let i = 0; i < cart.products.length; i++) {
//                     const productId = cart.products[i].quantity;

//                     await Products.updateOne(
//                         {_id:productId},
//                         {
//                             $inc: {
//                                 quantity:-count
//                             }
//                         }
//                     );
//                 }
//             }
       
//     await Cart.deleteOne({userid});
//     res.json({payment:true});

// }
//     } catch (error) {
//         console.log("error in verifyPayment : ",error);
//         res.redirect('/500');
//     }
// }


