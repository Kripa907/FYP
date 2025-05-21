import FeedbackModel from '../models/FeedbackModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';

// Add this function to handle review submissions
const submitFeedback = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;
    const userId = req.user._id; // Get user ID from auth middleware

    // Validate required fields
    if (!doctorId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get user details to include name
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user has had an appointment with this doctor
    const pastAppointment = await appointmentModel.findOne({
      doctor: doctorId,
      user: userId,
      status: { $in: ['Completed', 'Paid', 'Confirmed'] } // Allow reviews for completed, paid, or confirmed appointments
    });

    if (!pastAppointment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review doctors you have had appointments with'
      });
    }

    // Check if review exists
    let feedback = await FeedbackModel.findOne({ doctor: doctorId, user: userId });
    if (feedback) {
      // Update existing review
      feedback.rating = Number(rating);
      feedback.comment = comment;
      feedback.userName = user.name;
      feedback.createdAt = new Date();
      await feedback.save();
      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        feedback: {
          ...feedback._doc,
          userName: user.name
        }
      });
    } else {
      // Create new feedback
      feedback = new FeedbackModel({
        doctor: doctorId,
        user: userId,
        userName: user.name,
        rating: Number(rating),
        comment,
        createdAt: new Date()
      });
      await feedback.save();
      return res.status(200).json({ 
        success: true, 
        message: "Review submitted successfully",
        feedback: {
          ...feedback._doc,
          userName: user.name
        }
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error submitting review" 
    });
  }
};

// Get all reviews by the logged-in user
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviews = await FeedbackModel.find({ user: userId })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });

    const mappedReviews = reviews.map(r => ({
      doctorName: r.doctor && r.doctor.name ? r.doctor.name : 'Unknown',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewId: r._id
    }));

    res.status(200).json({ success: true, reviews: mappedReviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your reviews' });
  }
};

export { submitFeedback, getUserReviews };