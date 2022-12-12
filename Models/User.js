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
        entries:[ {
            type:ObjectId,
            ref: 'Entry'
        }]
    },
    income:{
        categories: [
        {
            category: String,
            subcategories:
            [String]
        }],
        entries:[ {
            type:ObjectId,
            ref: 'Entry'
        }]
    },
    investment: {
        categories: [
        {
            category: String,
            subcategories:
            [String]
        }],
        entries:[ {
            type:ObjectId,
            ref: 'Entry'
        }]
    }
});

module.exports = mongoose.model('User',userSchema);