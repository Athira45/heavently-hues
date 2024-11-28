const couponModel = require('../models/couponModel');

const loadCoupons = async (req,res)=>{
    try {
        const admin = req.session.admin;
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const coupons = await couponModel.find()
        .sort({ addedDate: -1 })
        .skip(skip)
        .limit(limit);

        const totalCoupons = await couponModel.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('coupon', { coupons , totalPages , currentPage: page});
       

    } catch (error) {
        console.log("error in load coupon:",error);
    }
}

const addCoupon = async(req,res) =>{
    // console.log("reeeersddddddsssssssssssssssssss")
    const admin = req.session.admin;
   try {
        const { couponCode, percentage, minPrice, maxRedeemAmount, expiryDate  } = req.body;
        let coupon = await couponModel.findOne({ couponCode: couponCode });
        if (!coupon) {
            coupon = new couponModel({
                couponCode,
                percentage,
                minPrice,
                maxRedeemAmount,
                expiryDate
            });
            await coupon.save();
            return res.status(200).json({ message: 'Coupon added successfully' });
        } else {
            return res.status(400).json({ message: 'Coupon Code already exists' });
        }

   } catch (error) {
    console.log("error in addCoupon:", error);
   }
};

const editCoupon = async(req,res)=>{
    const admin = req.session.admin;
    try {
        const { couponCode, percentage, minPrice, maxRedeemAmount, expiryDate } = req.body;
        await couponModel.updateOne(
            { _id: req.query.id },
            {
                $set: {
                    couponCode,
                    percentage,
                    minPrice,
                    maxRedeemAmount,
                    expiryDate
                }
            }
        )
        return res.status(200).json({ message: 'Coupon edited successfully' });
    } catch (error) {
        console.log("error in editcoupon:", error);
    }
};

const deleteCoupon = async (req, res) => {
    const admin = req.session.admin;
    try {
        const couponId = req.query.couponId;
        await couponModel.deleteOne({ _id: couponId });
        res.json({ success: true });
    } catch (error) {
        console.log("error in delete coupon:",error);
    }
};

module.exports = {
    loadCoupons,
    addCoupon,
    editCoupon,
    deleteCoupon,


}