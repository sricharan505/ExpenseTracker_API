const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const entrySchema = new schema({
    value: {type: Number, required: true},
    type:{type: String, required:true},
    category: {type: String, required:true},
    subcategory: {type: String},
    desc: {type:String},
    date:{type:Number, required:true},
    userid: {type:ObjectId,ref: 'User'}
});

module.exports = mongoose.model("Entry", entrySchema);