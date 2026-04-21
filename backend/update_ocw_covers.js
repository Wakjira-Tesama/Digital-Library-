const mongoose = require("mongoose");
const Ebook = require("./models/Ebook");
const dotenv = require("dotenv");
const https = require("https");

const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/desktop_pooling";

// Helper to fetch JSON from API
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "ASTULibraryApp/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function updateCovers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for Cover Update...");

    // Find all books that have an MIT OCW External Link or generic SVG cover
    const ocwBooks = await Ebook.find({
      $or: [
        { externalLink: { $regex: /ocw\.mit\.edu/ } },
        { coverUrl: { $regex: /^\/covers\// } }
      ]
    });

    console.log(`Found ${ocwBooks.length} OCW books to process.`);

    let updatedCount = 0;

    for (let book of ocwBooks) {
      console.log(`Searching cover for: ${book.title}`);
      
      // Some known overrides for generic OCW titles
      let searchQuery = book.title;
      // If the title is too generic and authored by "MIT Faculty Notes", it might not be a real published book on OpenLibrary
      if (searchQuery.includes("Faculty") || book.author.includes("Faculty")) {
        console.log(`  -> Skipping "${book.title}" (Faculty Notes, no published cover)`);
        continue;
      }

      // Encode query for URL
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=1`;
      
      try {
        const result = await fetchJson(searchUrl);
        
        if (result && result.docs && result.docs.length > 0) {
          const doc = result.docs[0];
          let coverId = doc.cover_i;
          let newCoverUrl = null;

          if (coverId) {
             newCoverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          } else if (doc.isbn && doc.isbn.length > 0) {
             newCoverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
          }

          if (newCoverUrl) {
            console.log(`  -> Found cover! Updating to: ${newCoverUrl}`);
            book.coverUrl = newCoverUrl;
            await book.save();
            updatedCount++;
          } else {
            console.log(`  -> No cover ID/ISBN found in OpenLibrary for this exact match.`);
          }
        } else {
          console.log(`  -> No match found in OpenLibrary.`);
        }
      } catch (e) {
        console.error(`  -> Failed to fetch for ${book.title}`);
      }
      
      // Delay so we don't spam the free OpenLibrary API
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nOperation Complete. Updated ${updatedCount} book covers.`);
    process.exit(0);

  } catch (error) {
    console.error("Error updating covers:", error);
    process.exit(1);
  }
}

updateCovers();
