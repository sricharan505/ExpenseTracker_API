const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userSchema = new schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    acctype: { type: String, required: true },
    expense:{
        categories: [
        {
            category: String,
            subcategories:
            [String]
        }],
        total:{type: Number,default:0}
    },
    income:{
        categories: [
        {
            category: String,
            subcategories:
            [String]
        }],
        total:{type: Number,default:0}
    },
    investment: {
        categories: [
        {
            category: String,
            subcategories:
            [String]
        }],
        total:{type: Number,default:0}
    }
});

module.exports = mongoose.model('User',userSchema);