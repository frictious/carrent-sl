const   mongoose            = require("mongoose");

const driverSchema = new mongoose.Schema({
    name : {
        type: String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    contact : String,
    address : String,
    cv : String,
    cvName : String
});

module.exports = mongoose.model("Driver", driverSchema);