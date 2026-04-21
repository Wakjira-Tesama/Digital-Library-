const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Ebook = require("./models/Ebook");
const Library = require("./models/Library");

const seedEbooks = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 2. Clear existing Ebooks
    const deleteResult = await Ebook.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing ebooks.`);

    // 3. Ensure "ASTU Main Library" exists
    let mainLibrary = await Library.findOne({ name: "ASTU Main Library" });
    if (!mainLibrary) {
      mainLibrary = new Library({ name: "ASTU Main Library" });
      await mainLibrary.save();
      console.log("Created 'ASTU Main Library'.");
    } else {
      console.log("Found existing 'ASTU Main Library'.");
    }

    // 4. Read JSON data
    const rawData = fs.readFileSync(path.join(__dirname, "university_engineering_compsci_applied_science_100_books.json"), "utf8");
    const booksData = JSON.parse(rawData);

    // 5. Map and Insert Books
    const mappedBooks = booksData.map((book) => ({
      title: book.transmission_title,
      author: book.author || "Unknown",
      description: book.description || "",
      category: book.category || "General",
      tags: book.meta_tags || [],
      library: mainLibrary._id,
      coverUrl: book.cover_url || "",
      fileUrl: book.pdf_url || "",
      popularityScore: Math.floor(Math.random() * 100), // Random score for variety
    }));

    const insertResult = await Ebook.insertMany(mappedBooks);
    console.log(`Successfully seeded ${insertResult.length} ebooks from university-engineering-comp file.`);

    // 6. Close Connection
    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedEbooks();
