const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    place: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    travelType: { type: String, required: true },
    amount: { type: Number, required: true },
    upiId: { type: String, required: true },
    doubts: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
