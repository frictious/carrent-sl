const   mongoose            = require("mongoose");

const carSchema = new mongoose.Schema({
    carName : {
        type : String,
        required : true
    },
    carModel : String,
    engineType : String,
    noOfDoors : Number,
    mileage : String,
    transmission : String,
    price : Number,
    luggage : String,
    noOfSeats : Number,
    quantity: Number,
    description: String,
    front : String,
    back : String,
    inside :String,
    full : String
});

module.exports = mongoose.model("Car", carSchema);