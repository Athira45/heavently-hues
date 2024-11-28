

const mongoose = require('mongoose');
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const walletSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
   transactions: [
    {
        transaction_id: {
            type: String,
            unique: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Order,
          },
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Product,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },

    }
   ]
});
const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
