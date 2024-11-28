
const User = require("../models/userModel");
const Products = require("../models/productModel");
const category = require("../models/categoryModel.js");
const Orders = require ('../models/orderModel.js');
const bcrypt = require('bcrypt');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');





const LoadAdLogin = async(req,res)=>{
    try {
        res.render('adminLogin');
    } catch (error) {
        console.error('Error loading dashboard:', error);
       
    }
}

const verifyLogin = async (req,res) =>{
    try{
         const email = process.env.adminEmail;
         const password = process.env.adminPassword;

         if(email === req.body.email && password === req.body.password){
            
            req.session.admin = true;
            // console.log(req.session);
             res.redirect('/admin/dashboard');
             
         }else{
            
            const errormsg = "Admin not found";
            req.flash('err',errormsg);
            console.log(req.session);
            
            res.redirect('/admin/adlogin');
         }
    }catch(error){
        console.error('Error:', error);
    }
}

// const LoadDashboard = async(req,res)=>{
//     try {
//         res.render('dashboard');
//     } catch (error) {
//         console.error('Error loading dashboard:', error);
       
//     }
// }





//ggggggggg

const LoadDashboard = async(req,res)=>{
    try {
        let { filterType, startDate, endDate } = req.query;
        filterType = filterType || 'daily';
    
        // Get current date in local timezone
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
        let dateQuery = {};
    
        switch(filterType) {
          case 'daily':
            dateQuery = {
              createdAt: {
                $gte: todayStart,
                $lte: todayEnd
              }
            };
            break;
    
          case 'weekly':
            const weekStart = new Date(todayStart);
            weekStart.setDate(todayStart.getDate() - todayStart.getDay());
            const weekEnd = new Date(todayEnd);
            weekEnd.setDate(weekStart.getDate() + 6);
            dateQuery = {
              createdAt: {
                $gte: weekStart,
                $lte: weekEnd
              }
            };
            break;
    
          case 'yearly':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            dateQuery = {
              createdAt: {
                $gte: yearStart,
                $lte: yearEnd
              }
            };
            break;
    
          case 'custom':
            if (startDate && endDate) {
              const customStart = new Date(startDate);
              const customEnd = new Date(endDate);
              customEnd.setHours(23, 59, 59, 999);
              dateQuery = {
                createdAt: {
                  $gte: customStart,
                  $lte: customEnd
                }
              };
            } else {
              // Default to today if no dates provided
              dateQuery = {
                createdAt: {
                  $gte: todayStart,
                  $lte: todayEnd
                }
              };
            }
            break;
        }
    
        // Use aggregation pipeline for more accurate results
        const ordersData = await Orders.aggregate([
          { 
            $match: dateQuery 
          },
          {
            $facet: {
              // Get total stats
              totals: [
                {
                  $group: {
                    _id: null,
                    totalAmount: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    totalCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
                    totalDiscountPercentage: {
                      $sum: {
                        $multiply: [
                          '$total',
                          { $divide: [{ $ifNull: ['$discountPercentage', 0] }, 100] }
                        ]
                      }
                    }
                  }
                }
              ],
              // Get daily stats
              dailyStats: [
                {
                  $group: {
                    _id: { 
                      $dateToString: { 
                        format: '%Y-%m-%d', 
                        date: '$createdAt',
                        timezone: 'Asia/Kolkata' // Adjust timezone as needed
                      }
                    },
                    dailyAmount: { $sum: '$total' },
                    dailyCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
                    dailyDiscountPercentage: {
                      $sum: {
                        $multiply: [
                          '$total',
                          { $divide: [{ $ifNull: ['$discountPercentage', 0] }, 100] }
                        ]
                      }
                    }
                  }
                },
                { $sort: { '_id': 1 } }
              ],
              // Get status counts from products array
              statusCounts: [
                { $unwind: '$products' },
                {
                  $group: {
                    _id: '$products.orderStatus',
                    count: { $sum: 1 }
                  }
                }
              ]
            }
          }
        ]);
    
        // Process aggregation results
        const aggregateData = ordersData[0];
        const totals = aggregateData.totals[0] || {
          totalAmount: 0,
          totalOrders: 0,
          totalCouponDiscount: 0,
          totalDiscountPercentage: 0
        };
    
        // Process order status counts
        const orderStatusMap = {
          pending: 0,
          shipped: 0,
          Delivered: 0,
          'request return': 0,
          returned: 0,
          'request cancellation': 0,
          cancelled: 0
        };
    console.log("orderStatusMap",orderStatusMap)
        aggregateData.statusCounts.forEach(status => {
          if (orderStatusMap.hasOwnProperty(status._id)) {
            orderStatusMap[status._id] = status.count;
          }
        });
    
        // Process daily stats for charts
        const overallOrderAmount = aggregateData.dailyStats.map(day => ({
          date: day._id,
          amount: parseFloat(day.dailyAmount.toFixed(2))
        }));
    
        const overallDiscount = aggregateData.dailyStats.map(day => ({
          date: day._id,
          amount: parseFloat((day.dailyCouponDiscount + day.dailyDiscountPercentage).toFixed(2))
        }));
    
        // Calculate total discount
        const totalDiscount = totals.totalCouponDiscount + totals.totalDiscountPercentage;

        const topProducts = await Orders.aggregate([
            { $match: dateQuery },  // Changed from filter to dateQuery
            { $unwind: "$products" },
            { $group: { _id: "$products.productId", totalSold: { $sum: "$products.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { productName: "$product.name", totalSold: 1 } }
        ]);

        // Top 5 Best-Selling Categories - Using dateQuery instead of filter
        const topCategories = await Orders.aggregate([
            { $match: dateQuery },  // Changed from filter to dateQuery
            { $unwind: "$products" },
            { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            { $group: { _id: "$productDetails.category", totalSold: { $sum: "$products.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { categoryName: "$category.name", totalSold: 1 } }
        ]);
    
    
        // Prepare dashboard data
        const dashboardData = {
          filterType,
          startDate: startDate || '',
          endDate: endDate || '',
          totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
          totalDiscount: parseFloat(totalDiscount.toFixed(2)),
          salesCount: totals.totalOrders,
          orderStatusMap,
          overallOrderAmount,
          overallDiscount,
          topProducts,
          topCategories,
        };
    
        // Log the processed data
        console.log('Dashboard Data:', dashboardData);
    
        // Render the dashboard
        res.render('dashboard', dashboardData);
    } catch (error) {
        console.error('Error loading dashboard:', error);
       
    }
}



// const LoadDashboard = async (req, res) => {
//     try {
//         let { filterType, startDate, endDate } = req.query;
//         filterType = filterType || 'daily';

//         const now = new Date();
//         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

//         let dateQuery = {};

//         switch (filterType) {
//             case 'daily':
//                 dateQuery = {
//                     createdAt: { $gte: todayStart, $lte: todayEnd }
//                 };
//                 break;
//             case 'weekly':
//                 const weekStart = new Date(todayStart);
//                 weekStart.setDate(todayStart.getDate() - todayStart.getDay());
//                 const weekEnd = new Date(weekStart);
//                 weekEnd.setDate(weekStart.getDate() + 6);
//                 dateQuery = {
//                     createdAt: { $gte: weekStart, $lte: weekEnd }
//                 };
//                 break;
//             case 'yearly':
//                 const yearStart = new Date(now.getFullYear(), 0, 1);
//                 const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
//                 dateQuery = {
//                     createdAt: { $gte: yearStart, $lte: yearEnd }
//                 };
//                 break;
//             case 'custom':
//                 if (startDate && endDate) {
//                     const customStart = new Date(startDate);
//                     const customEnd = new Date(endDate);
//                     customEnd.setHours(23, 59, 59, 999);
//                     dateQuery = {
//                         createdAt: { $gte: customStart, $lte: customEnd }
//                     };
//                 } else {
//                     dateQuery = { createdAt: { $gte: todayStart, $lte: todayEnd } };
//                 }
//                 break;
//         }

//         const ordersData = await Orders.aggregate([
//             { $match: dateQuery },
//             {
//                 $facet: {
//                     totals: [
//                         {
//                             $group: {
//                                 _id: null,
//                                 totalAmount: { $sum: '$total' },
//                                 totalOrders: { $sum: 1 },
//                                 totalCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
//                                 totalDiscountPercentage: {
//                                     $sum: {
//                                         $multiply: ['$total', { $divide: [{ $ifNull: ['$discountPercentage', 0] }, 100] }]
//                                     }
//                                 }
//                             }
//                         }
//                     ],
//                     dailyStats: [
//                         {
//                             $group: {
//                                 _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
//                                 dailyAmount: { $sum: '$total' },
//                                 dailyCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
//                                 dailyDiscountPercentage: {
//                                     $sum: {
//                                         $multiply: ['$total', { $divide: [{ $ifNull: ['$discountPercentage', 0] }, 100] }]
//                                     }
//                                 }
//                             }
//                         },
//                         { $sort: { '_id': 1 } }
//                     ],
//                     statusCounts: [
//                         { $unwind: '$products' },
//                         {
//                             $group: {
//                                 _id: '$products.orderStatus',
//                                 count: { $sum: 1 }
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]);

//         const aggregateData = ordersData[0];
//         const totals = aggregateData.totals[0] || { totalAmount: 0, totalOrders: 0, totalCouponDiscount: 0, totalDiscountPercentage: 0 };

//         const orderStatusMap = {
//             pending: 0,
//             shipped: 0,
//             Delivered: 0,
//             'request return': 0,
//             returned: 0,
//             'request cancellation': 0,
//             cancelled: 0
//         };

//         aggregateData.statusCounts.forEach(status => {
//             if (orderStatusMap.hasOwnProperty(status._id)) {
//                 orderStatusMap[status._id] = status.count;
//             }
//         });

//         const overallOrderAmount = aggregateData.dailyStats.map(day => ({ date: day._id, amount: parseFloat(day.dailyAmount.toFixed(2)) }));
//         const overallDiscount = aggregateData.dailyStats.map(day => ({
//             date: day._id,
//             amount: parseFloat((day.dailyCouponDiscount + day.dailyDiscountPercentage).toFixed(2))
//         }));

//         const totalDiscount = totals.totalCouponDiscount + totals.totalDiscountPercentage;

//         const topProducts = await Orders.aggregate([
//             { $match: dateQuery },
//             { $unwind: "$products" },
//             { $group: { _id: "$products.productId", totalSold: { $sum: "$products.quantity" } } },
//             { $sort: { totalSold: -1 } },
//             { $limit: 5 },
//             { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
//             { $unwind: "$product" },
//             { $project: { productName: "$product.name", totalSold: 1 } }
//         ]);

//         const topCategories = await Orders.aggregate([
//             { $match: dateQuery },
//             { $unwind: "$products" },
//             { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "productDetails" } },
//             { $unwind: "$productDetails" },
//             { $group: { _id: "$productDetails.category", totalSold: { $sum: "$products.quantity" } } },
//             { $sort: { totalSold: -1 } },
//             { $limit: 5 },
//             { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
//             { $unwind: "$category" },
//             { $project: { categoryName: "$category.name", totalSold: 1 } }
//         ]);

//         const dashboardData = {
//             filterType,
//             startDate: startDate || '',
//             endDate: endDate || '',
//             totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
//             totalDiscount: parseFloat(totalDiscount.toFixed(2)),
//             salesCount: totals.totalOrders,
//             orderStatusMap,
//             overallOrderAmount,
//             overallDiscount,
//             topProducts,
//             topCategories
//         };

//         res.render("dashboard", { dashboardData });
//     } catch (error) {
//         console.error("Error in LoadDashboard function:", error);
//         res.status(500).send("Error loading dashboard");
//     }
// };





// const getSalesData = async (req, res) => {
//     const { range } = req.query;  // 'daily', 'weekly', or 'yearly'
//     let data = [];
//     let labels = [];

//     try {
//         await client.connect();
//         const db = client.db('yourDatabaseName');
//         const collection = db.collection('sales');

//         if (range === 'daily') {
//             // Replace with MongoDB query to get daily data
//             data = [10, 20, 15, 30, 25];
//             labels = ['12 AM', '6 AM', '12 PM', '6 PM', '11 PM'];
//         } else if (range === 'weekly') {
//             // Replace with MongoDB query to get weekly data
//             data = [100, 150, 170, 120, 200, 180, 220];
//             labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
//         } else if (range === 'yearly') {
//             // Replace with MongoDB query to get monthly data
//             data = [500, 600, 550, 700, 750, 800, 900, 850, 900, 950, 1000, 1050];
//             labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//         }

//         res.json({ success: true, data, labels });
//     } catch (error) {
//         console.error("Error getSalesData:", error);
//         res.json({ success: false, error: 'Failed to fetch sales data' });
//     } finally {
//         await client.close();
//     }
// };



const LoadAdminUsers = async(req,res)=>{
    try {
        const userData = await User.find()
        res.render('adminUsers',{userData});
    } catch (error) {
        console.error('Error loading dashboard:', error);
       
    }
}


const listUnlistUser = async (req, res) => {
    try {
        const id = req.query.id;
        // console.log("id::::",id);
        const user = await User.findOne({ _id: id })
        // console.log(user)
        if (user) {
            const newStatus = user.status === "Active" ? "Block" : "Active";
            const updatedUser = await User.findByIdAndUpdate(id, { $set: { status: newStatus } }, { new: true })
            const alluser = await User.find();
            // res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            // res.setHeader('Pragma', 'no-cache');
            // res.setHeader('Expires', '0');
            res.redirect("/admin/adminUsers");
        } else {
            res.send("listing and unlisting");
        }
    } catch (error) {
        res.redirect("/500");
    }
}



const InternalServer = async(req,res)=>{
    try {
      res.render("500")
    } catch (error) {
     res.redirect("/500")
    }
  }


  

// SALES REPORT BASED ON PDFKIT AND EXCEL
const salesReport = async (req, res) => {
    try {
        const { interval, reportType } = req.query;
        let startDate, endDate;

        switch (interval) {
            case 'day':
                startDate = new Date(req.query.date);
                endDate = new Date(req.query.date);
                endDate.setDate(endDate.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(req.query.date);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 7);
                break;
            case 'month':
                startDate = new Date(req.query.month);
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(req.query.year, 0, 1);
                endDate = new Date(req.query.year, 11, 31);
                break;
            case 'custom':
                startDate = new Date(req.query.startDate);
                endDate = new Date(req.query.endDate);
                break;
            default:
                return res.status(400).json({ error: 'Invalid interval type' });
        }

        const orders = await Orders.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('user');

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No purchase found in this interval' });
        }

        if (reportType === 'pdf') {
            generatePDFReport(orders, startDate, endDate, interval, res);
        } else if (reportType === 'excel') {
            generateExcelReport(orders, startDate, endDate, interval, res);
        } else {
            res.status(400).json({ error: 'Invalid report type' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// const generatePDFReport = (orders, startDate, endDate, interval, res) => {
//     const pdfDoc = new PDFDocument();
//     const pdfPath = `sales_report_${interval}.pdf`;

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${pdfPath}"`);
//     pdfDoc.pipe(res);

//     pdfDoc.fontSize(12).text(`Sales Report - ${interval.toUpperCase()}`, { align: 'center' }).moveDown();
//     pdfDoc.fontSize(10).text(`Orders from ${startDate.toDateString()} to ${endDate.toDateString()}`).moveDown();

//     const totalSales = orders.reduce((total, order) => total + order.total, 0);
//     const totalDiscount = orders.reduce((total, order) => total + (order.couponDiscount || 0), 0);

//     pdfDoc.fontSize(10).text(`Total Amount: ${totalSales.toFixed(2)}`, { align: 'right' }).moveDown();

//     pdfDoc.fontSize(10).text('Order Details', { align: 'left' }).moveDown();
//     orders.forEach((order) => {
//         pdfDoc.fontSize(10).text(`Order ID: ${order._id.toString()}`);
//         pdfDoc.text(`Date: ${order.date.toDateString()}`);
//         pdfDoc.text(`User: ${order.user.name}`);
//         pdfDoc.text(`Payment Mode: ${order.paymentMode}`);
//         pdfDoc.text(`Total Quantity: ${order.totalQuantity}`);
//         pdfDoc.text(`Total Amount: ${order.total.toFixed(2)}`);
//         pdfDoc.moveDown();

//         order.products.forEach((product) => {
//             pdfDoc.fontSize(9)
//                 .text(`Product: ${product.name}`)
//                 .text(`Price: ${product.price.toFixed(2)}`)
//                 .text(`Quantity: ${product.quantity}`)
//                 .text(`Total: ${product.total.toFixed(2)}`)
//                 .moveDown();
//         });
//     });

//     pdfDoc.fontSize(10).text(`Total Discount: ${totalDiscount.toFixed(2)}`, { align: 'right' }).moveDown();
//     pdfDoc.end();
// };

const formatDate = (date) => {
  const day = date.getDate(); // Get the day of the month
  const month = date.getMonth() + 1; // Get the month (0-based index, so add 1)
  const year = date.getFullYear(); // Get the full year

  // Return the formatted date in MM/D/YYYY format
  return `${day}/${month}/${year}`;
};

const generatePDFReport = (orders, startDate, endDate, interval, res) => {
  const pdfDoc = new PDFDocument();
  const pdfPath = `sales_report_${interval}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${pdfPath}"`);
  pdfDoc.pipe(res);

  // Report Title
  pdfDoc.fontSize(14).text('Sales Report', { align: 'center' });
  pdfDoc.moveDown(0.5);

  // Date Range Info
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  pdfDoc.fontSize(10).text(`Orders from ${formattedStartDate} to ${formattedEndDate}`, { align: 'center' });
  pdfDoc.moveDown(0.5);

  // Table Headers in a Single Line
  pdfDoc.fontSize(10);
  const yPosition = pdfDoc.y; // Save the current y position for headers
  pdfDoc.text('Order ID', 50, yPosition)
    .text('Date', 150, yPosition)
    .text('Total', 220, yPosition)
    .text('Offer', 290, yPosition)
    .text('Coupon', 360, yPosition)
    .text('Payment Method', 430, yPosition);

  // Line after headers
  pdfDoc.moveTo(50, pdfDoc.y + 15).lineTo(500, pdfDoc.y + 15).stroke(); 
  pdfDoc.moveDown(0.3);

  // Orders Table Rows
  orders.forEach((order) => {
    pdfDoc.fontSize(9);
    const formattedOrderDate = formatDate(order.date);
    pdfDoc.text(order._id.toString(), 50)
      .text(formattedOrderDate, 150)
      .text(order.total.toFixed(2), 220)
      .text(order.offer ? order.offer.toFixed(2) : '0.00', 290)
      .text(order.coupon ? order.coupon.toFixed(2) : '0.00', 360)
      .text(order.paymentMethod, 430);
    pdfDoc.moveDown(0.3);
  });~

  pdfDoc.end();
};









const generateExcelReport = (orders, startDate, endDate, interval, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Date Ordered', key: 'date', width: 15 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Payment Mode', key: 'paymentMode', width: 15 },
        { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
        { header: 'Total Price', key: 'total', width: 20 },
        { header: 'Discount', key: 'couponDiscount', width: 15 }
    ];

    orders.forEach(order => {
        worksheet.addRow({
            orderId: order._id.toString(),
            date: order.date.toDateString(),
            userName: order.user.name,
            paymentMode: order.paymentMode,
            totalQuantity: order.totalQuantity,
            total: order.total.toFixed(2),
            couponDiscount: (order.couponDiscount || 0).toFixed(2)
        });

        order.products.forEach(product => {
            worksheet.addRow({
                orderId: '',
                date: '',
                userName: '',
                paymentMode: '',
                totalQuantity: '',
                total: '',
                productName: product.name,
                productPrice: product.price.toFixed(2),
                productQuantity: product.quantity,
                productTotal: product.total.toFixed(2)
            });
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sales_report_${interval}.xlsx"`);
    
    workbook.xlsx.write(res).then(() => {
        res.end();
    });
};


module.exports = {
    LoadDashboard,
    LoadAdLogin,
    LoadAdminUsers,
    verifyLogin,
    listUnlistUser,
    InternalServer,
    salesReport,
    
}