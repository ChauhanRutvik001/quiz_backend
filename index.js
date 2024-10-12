import express from "express";
import dotenv from "dotenv";
import databaseConnection from "./utils/database.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import quizRoute from './routes/quizRoute.js';
import cors from "cors";
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import isAuthorized from "./middlewares/auth.js";

// Load environment variables from .env file
dotenv.config({ path: ".env" });
databaseConnection();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const upload = multer({ dest: 'uploads/' });

const corsOptions = {
    origin: process.env.ORIGIN,
    credentials: true
};
app.use(cors(corsOptions));

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/user/quiz", quizRoute);

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server listening at port ${process.env.PORT}`);
});




const parseGeneratedQuestions = (content) => {
    const questions = [];
    const lines = content.split('\n');
    let currentQuestion = null;
  
    lines.forEach((line) => {
      line = line.trim();
      if (!line) return;
  
      // Match question start (e.g., "1.", "2.", etc.)
      if (line.match(/^\d+\./)) {
        if (currentQuestion) {
          // Assign type based on options and correctAnswers
          if (currentQuestion.correctAnswers.length === 1) {
            currentQuestion.type =
              currentQuestion.options.length === 2 ? "truefalse" : "single";
          } else {
            currentQuestion.type = "multiple";
          }
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: line.replace(/^\d+\./, "").trim(),
          options: [],
          correctAnswers: [],
        };
      }
  
      // Options for MCQ (handles 'a)', 'b)', 'c)', 'd)')
      if (line.match(/^[abcd]\)/)) {
        currentQuestion.options.push(line.slice(3).trim());
      }
  
      // Answer section
      if (line.startsWith("Answer:")) {
        const answer = line.split(":")[1].trim();
        if (answer.toLowerCase() === "true" || answer.toLowerCase() === "false") {
          currentQuestion.options = ["True", "False"];
          currentQuestion.correctAnswers.push(
            answer.toLowerCase() === "true" ? 0 : 1
          );
        } else {
          const answerIndex =
            answer.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
          currentQuestion.correctAnswers.push(answerIndex);
        }
      }
    });
  
    // Push the last question
    if (currentQuestion) {
      if (currentQuestion.correctAnswers.length === 1) {
        currentQuestion.type =
          currentQuestion.options.length === 2 ? "truefalse" : "single";
      } else {
        currentQuestion.type = "multiple";
      }
      questions.push(currentQuestion);
    }
  
    return questions;
  };
  
  // Route handler for generating MCQs from PDF
  app.post(
    "/api/v1/user/generate-mcqs",
    isAuthorized,
    upload.single("file"),
    (req, res) => {
      const topic = req.body.topic;
      const pdfPath = req.file.path;
      const numberOfQuestions = req.body.number_of_questions;
      const questionType = req.body.question_type;
  
      if (!topic || !pdfPath || !numberOfQuestions || !questionType) {
        return res
          .status(400)
          .json({ error: "Topic, PDF, number of questions, and question type are required" });
      }
  
      const python = spawn("python", [
        "model.py",
        pdfPath,
        topic,
        numberOfQuestions,
        questionType,
      ]);
  
      let data = "";
      python.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });
  
      python.stderr.on("data", (error) => {
        console.error(`Error: ${error.toString()}`);
      });
  
      python.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({ error: "Error generating questions" });
        }
  
        try {
          console.log(data);
          const mcqQuestions = parseGeneratedQuestions(data).map(
            (question, index) => ({
              ...question,
              _id: `${Date.now()}${index}`, // Generate unique ID
            })
          );
  
          console.log(mcqQuestions);
          return res.status(200).json({ questions: mcqQuestions });
        } catch (err) {
          console.error(`Failed to parse output: ${err.message}`);
          res
            .status(500)
            .json({ error: "Failed to process output from Python script" });
        } finally {
          fs.unlinkSync(pdfPath); // Clean up the uploaded PDF file
        }
      });
    }
  );
  

