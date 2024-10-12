import Quiz from "../models/quizModel.js";
import { v4 as uuidv4 } from "uuid"; // For generating unique codes
import QuizSubmission from "../models/QuizSubmission.js";
import User from "../models/userModel.js";

// Create a new quiz

export const createQuiz = async (req, res) => {
  try {
    const { title, description, questions, userId, startDate, endDate } = req.body;
    const code = uuidv4(); // Generate a unique code for the quiz

    console.log("userId", userId);

    // Check if userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Validate startDate and endDate
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Start and End dates are required" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ success: false, message: "Start date must be earlier than end date" });
    }

    // Create new quiz
    const newQuiz = new Quiz({
      title,
      description,
      questions,
      code,
      userId,
      startDate,
      endDate
    });

    console.log("newQuiz ::::", newQuiz);  
    await newQuiz.save();
    console.log("newQuiz saved");

    res.status(201).json({ success: true, quiz: newQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get all quizzes for a specific user
export const getAllQuizzes = async (req, res) => {
  try {
    const { userId } = req.query; // Extract the userId from the query parameter

    // Fetch only quizzes that belong to the logged-in user
    const quizzes = await Quiz.find({ userId });

    res.status(200).json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Other controllers for fetching, updating, and deleting quizzes

// Get a single quiz by code (for accessing a quiz by code)
export const joinQuiz = async (req, res) => {
  try {
    const { userId, code } = req.body; // The code and userId sent by the frontend
    console.log("userId", userId);
    console.log("Received code:", code);

    // Find the quiz by the provided code
    const quiz = await Quiz.findOne({ code });

    
    // If the quiz is not found, send a 404 response
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // Check if the user has already submitted the quiz
    const submission = await QuizSubmission.findOne({ userId, quizId: quiz._id });

    // If the user has already submitted the quiz, return a 202 response with a message
    if (submission) {
      return res.status(202).json({ success: false, message: "You have already submitted this quiz." });
    }
    
    console.log("quiz", quiz);
    // If the user hasn't submitted the quiz, allow them to join
    res.status(200).json({ success: true, quiz });
  } catch (error) {
    // Handle any server errors and send a 500 response
    console.error("Error in joinQuiz:", error);
    res.status(500).json({ success: false, message: "Server error, please try again later." });
  }
};


// Edit a quiz
export const updateQuiz = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("userId", userId);
    console.log("req.params.code", req.params.code);
    const quiz = await Quiz.findOneAndUpdate(
      { code: req.params.code, user: userId }, // Ensure the quiz belongs to the user
      req.body,
      { new: true }
    );
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }
    
    res.status(200).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a quiz
// Delete a quiz
// Delete a quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { userId } = req.body;

    const quiz = await Quiz.findOneAndDelete({
      code: req.params.code,
      user : userId,
    });

    console.log("quiz", quiz);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you do not have permission to delete this quiz.",
      });
    }

    console.log("Deleting submissions for quiz ID:", quiz._id);

    // Log submissions before deletion
    const submissionsBefore = await QuizSubmission.find({ quizId: quiz._id });
    console.log("Submissions found before deletion:", submissionsBefore);

    // Delete submissions
    const result = await QuizSubmission.deleteMany({ quizId: quiz._id });
    console.log("Number of submissions deleted:", result.deletedCount);

    // Log submissions after deletion
    const submissionsAfter = await QuizSubmission.find({ quizId: quiz._id });
    console.log("Submissions found after deletion:", submissionsAfter);

    // Ensure the response is sent after all operations are complete
    res.status(200).json({ success: true, message: "Quiz and submissions deleted successfully" });
  } catch (error) {
    console.error("Error in deleteQuiz:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const submitQuiz = async (req, res) => {
  try {
    const { quizId, quizCode, userId, Creater, username, score } = req.body; // Extract data from request body
    
    // Validate all required fields are provided
    if (!quizId || !quizCode || !userId || !username || score === undefined || Creater === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Create a new quiz submission
    const newSubmission = new QuizSubmission({
      quizId,
      quizCode,
      userId,
      username,
      score,
      Creater
    });

    // Save the submission to the database
    await newSubmission.save();

    // Respond with success message and the created submission
    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      submission: newSubmission,
    });
  } catch (error) {
    // Handle errors and respond with error message
    console.error("Error submitting quiz:", error.message); // Log error for debugging
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Get quiz submissions by quiz code or quizId
export const getQuizSubmissions = async (req, res) => {
  try {
    const { quizCode } = req.query;
    console.log("quizCode", quizCode);

    if (!quizCode) {
      return res
        .status(400)
        .json({ success: false, message: "Quiz code is required" });
    }

    // Find submissions based on quizCode
    const submissions = await QuizSubmission.find({ quizCode }).populate(
      "quizId",
      "title"
    );
    

    res.status(200).json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a quiz submission by its ID
export const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params; // Get submission ID from route parameters

    // Check if submissionId is provided
    if (!submissionId) {
      return res.status(400).json({ success: false, message: "Submission ID is required" });
    }

    // Find and delete the submission by its ID
    const submission = await QuizSubmission.findByIdAndDelete(submissionId);

    // If submission is not found, return a 404 error
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Send success response if deleted
    res.status(200).json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSubmission:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




export const getUserQuizSubmissions = async (req, res) => {
  try {
    const { userId } = req.query; // Retrieve userId from query parameters

    // Fetch quiz submissions for the user, and populate quiz and creater details
    const submissions = await QuizSubmission.find({ userId })
      .populate({
        path: 'quizId',
        select: 'title', // Select only the title of the quiz
      })
      .populate({
        path: 'Creater',
        select: 'fullName email', // Select username and email of the quiz creator
      })
      .sort({ submittedAt: -1 });

      console.log(submissions)

    if (!submissions.length) {
      return res.status(200).json({
        success: false,
        message: 'No quiz submissions found for this user.',
      });
    }

    res.status(200).json({
      success: true,
      submissions, // Quiz submissions already include quiz and creator details
    });
  } catch (error) {
    console.error('Error fetching user quiz submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user quiz submissions',
    });
  }
};



