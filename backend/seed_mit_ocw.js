const mongoose = require("mongoose");
const Ebook = require("./models/Ebook");
const Library = require("./models/Library");
const dotenv = require("dotenv");
const ocwBooks = require("./mit_ocw_books.json");

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/desktop_pooling";

async function seedOCW() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for MIT OCW Seeding...");

    // Find the primary library to associate these books with
    let library = await Library.findOne({ name: "ASTU Main Library" });
    if (!library) {
      library = await Library.create({
        name: "ASTU Main Library",
        address: "Adama, Ethiopia",
        contact_email: "library@astu.edu.et",
        subscription_status: "active",
      });
      console.log("Created 'ASTU Main Library'");
    }

    const libraryId = library._id;

    // We DO NOT CLEAR existing ebooks so we can keep the 100 seeded previously.
    console.log(`Appending ${ocwBooks.length} MIT OCW books to the database...`);

    const formattedBooks = ocwBooks.map((book) => ({
      title: book.title,
      author: book.author || "MIT Faculty",
      description: book.description,
      category: book.category,
      tags: book.tags || [],
      fileUrl: "",
      externalLink: book.externalLink || "",
      coverUrl: book.coverUrl || "",
      library: libraryId,
      popularityScore: Math.floor(Math.random() * 200) + 10, // Initialize with some popularity
    }));

    await Ebook.insertMany(formattedBooks);

    console.log("Successfully seeded MIT OCW materials!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding MIT OCW database:", error);
    process.exit(1);
  }
}

seedOCW();
