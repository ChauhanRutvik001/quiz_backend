import express from 'express';
import {
    createQuiz,
    getAllQuizzes,
    joinQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
    getQuizSubmissions,
    deleteSubmission,
    getUserQuizSubmissions
} from '../controllers/quizController.js';
import {isAuthorized} from '../middlewares/auth.js';


const router = express.Router();

router.use(isAuthorized);

// Create a new quiz
router.post('/create', createQuiz);

// Get all quizzes for the logged-in user
router.get('/', getAllQuizzes);

// Get a single quiz by code
router.post('/join', joinQuiz);

// Edit a quiz
router.put('/:code', updateQuiz);

// Delete a quiz
router.delete('/:code', deleteQuiz);

// Submit quiz and store the score
router.post('/submit', submitQuiz);

// Get quiz submissions by quiz code or quizId
router.get('/submissions', getQuizSubmissions);

// Delete a quiz submission by its ID
router.delete('/submissions/:submissionId', deleteSubmission);

// Route to get all quiz submissions for the logged-in user
router.get('/user-submissions', getUserQuizSubmissions);



export default router;
