const path = require('path');
const express=require('express');
const router=express();
const session = require('express-session');
const multer = require('multer');
const config = require('../config/config');
const productController = require('../controller/productController');
const orderController = require('../controller/orderController');
const couponController = require('../controller/couponController');
const offerController = require('../controller/offerController');

router.set('view engine','ejs');
router.set('views',path.join(__dirname,'../views/admin'));

const adminController = require('../controller/adminController');
const adminAuth = require('../middleware/adminAuth');

const categoryController = require('../controller/categoryController');


router.get('/adlogin',adminAuth.isLogin,adminController.LoadAdLogin);
router.post('/adlogin',adminController.verifyLogin);



//dashboard
router.get('/dashboard',adminAuth.verify,adminController.LoadDashboard);


// 
router.get('/dashboard',(req,res)=>{
  if(!req.session.user){
    res.redirect('/');
  }else{
    res.render('dashboard',{user:credential.name});
  }
});



router.get('/adCategory',categoryController.LoadAdminCategory);
//insert category
router.post('/adCategory',categoryController.insertCategory);

//edit category
router.get('/editcategory',categoryController.LoadEditCategory);
router.post('/editCategory',categoryController.updateCategory);

//deleteCategory
router.get('/deleteCategory',categoryController.deleteCategory);


//category status
router.get("/listcategory", categoryController.listUnlistCategory);

router.get('/allProducts',productController.LoadAllProducts);
router.get('/addProducts',productController.LoadAdProducts);


//all user
router.get('/adminUsers',adminController.LoadAdminUsers);

router.get('/alluserlist',adminController.listUnlistUser);

//.............
// multer handler middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Too many files uploaded' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
  
    return res.status(500).json({ error: 'File upload error' });
  }
 
  next();
};



//.end middleware........

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const name = formattedDate + '_' + file.originalname;
      cb(null, name);
  },
});

const upload = multer({ storage: storage });

// router.post('/addproducts', upload.array('image', 5),multerErrorHandler, productController.uploadProduct);
router.post('/addproducts', upload.array('image', 3), multerErrorHandler, productController.uploadProduct);



//Edit product
router.get('/editProduct',productController.LoadEditProduct);
router.post('/editProduct/:id', upload.array('images', 10), productController.handleEditProduct);
// router.post('/editProduct/:id', upload.array('image', 3), productController.handleEditProduct);

// router.get('/deleteimage',productController.imageDelete)
router.post('/delete-image',productController.imageDelete)


//list unlist product
router.get('/productList',productController.listunlistProduct);

//delete product

router.get('/deleteProduct',productController.productDelete);

//----------------------------------------orderManagement--------------------------------------------------------
router.get('/orders',adminAuth.verify,orderController.loadOrder);
router.get('/orders/:orderId/items/:itemId',orderController.itemDetails);
// router.get('/itemd',orderController.itemDetails);

router.post('/returnRequests',orderController.returnReq);


//----------------------------------------------------coupons-------------------------------------------------------
router.get('/coupons',couponController.loadCoupons);
router.post('/coupons/add',couponController.addCoupon);
router.put('/coupons/edit',couponController.editCoupon);
router.delete('/coupons/delete',couponController.deleteCoupon);

// --------------------------------------------offer----------------------------------------------------------
router.get('/categoryoffer',offerController.loadOffer);
router.post('/addCategoryOff',offerController.addCategoryOffer)
router.post('/categoryPercentageEdit',offerController.categoryOffer);
router.delete('/categoryoffer/delete/:id', offerController.deleteCategoryOffer);

router.post('/updateStatus',orderController.statusUpdate);

// -------------------------salesReport------------------------------------------- 
router.get('/reports',adminController.salesReport);

// router.post('/salesReport',adminController.saleRreports)

router.get("/500",adminController.InternalServer);


module.exports = router;
