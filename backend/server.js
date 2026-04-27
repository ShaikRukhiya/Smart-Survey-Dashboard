const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 CONNECT TO MONGODB
mongoose.connect("mongodb://127.0.0.1:27017/surveyDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 📦 SCHEMA
const surveySchema = new mongoose.Schema({
    entry: [String]
});

const Survey = mongoose.model("Survey", surveySchema);

// POST - save response
app.post("/submit", async (req, res) => {
    const newSurvey = new Survey(req.body);
    await newSurvey.save();
    res.json({ message: "Saved to DB" });
});

// GET - fetch all responses
app.get("/responses", async (req, res) => {
    const data = await Survey.find();
    res.json(data);
});

// DELETE - reset
app.delete("/reset", async (req, res) => {
    await Survey.deleteMany();
    res.json({ message: "All data deleted" });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});