import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: false },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: String, required: true },
    slots_booked: { type: Object, default: {} },
    licenseNumber: { type: String, required: true },
    certification: { type: String, required: true },
    approved: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    // Rating fields
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String },
        date: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
}, { minimize: false });

// Method to calculate average rating
doctorSchema.methods.calculateAverageRating = function() {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
        this.totalRatings = 0;
    } else {
        const sum = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        this.averageRating = sum / this.ratings.length;
        this.totalRatings = this.ratings.length;
    }
    return this.save();
};

// Use lowercase model name
const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);

export default doctorModel;
