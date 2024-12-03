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
            enum: [ 'pending', 'shipped', 'Delivered', 'request return', 'returned', 'request cancellation', 'cancelled']
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
        enum: ["pending", "rejected", "accepted", "requested"]
    },
    returnReason: {
        type: String,
        required: false
    },
    couponDiscount: {
        type: Number,
        required: false
    },
    discountPercentage: {
        type: Number,
        required: false
    },
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