const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var purchaseSchema = new Schema({
    
    books: [{
        item:{
            type: Schema.Types.ObjectId,
            ref:"Book",
            required: true
        },
        quantity:{
            type: Number,
            required: true
        }
    }],
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    totalPrice:{
        type: Number,
        required: true,
        default: 0
    },
    addressShippedTo:{
        type: Schema.Types.ObjectId,
        ref: "Address"
    },
    razorPayId:{
        type:"String"
    }
    
},{timestamps: true});

module.exports = mongoose.model("Purchase", purchaseSchema);
