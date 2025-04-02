const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Parse JSON and URL–encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------
// Blog Posts Data
// ------------------------------
let nextId = 1;
const posts = [];

const categories = [
  "data-science",
  "cyber-security",
  "cloud-computing",
  "regression",
  "artificial-intelligence",
  "machine-learning"
];

// Generate large content
function generateBigContent(topic) {
  return `
    ${topic} is a rapidly evolving field that has profound impacts on modern technology, business, and society at large. In recent years, ${topic} has grown exponentially, enabling groundbreaking innovations and transforming how organizations operate. This shift is fueled by significant advancements in computational power, algorithmic efficiency, and collaborative research. 
    <br><br>
    As companies seek to harness the power of ${topic}, they invest in large-scale data processing, sophisticated models, and cross-functional teams. This has led to new roles and responsibilities, bridging the gap between domain expertise and technical proficiency. Researchers and engineers are continually refining tools and techniques, making ${topic} more accessible to a broader audience. 
    <br><br>
    Moreover, ethical considerations have become paramount. Stakeholders must address issues such as data privacy, algorithmic bias, and the potential displacement of human labor. Many leading voices in the tech industry argue that ${topic} must evolve in a way that fosters responsible innovation, ensuring long-term societal benefits. 
    <br><br>
    Looking ahead, experts predict an even faster rate of adoption and expansion. Emerging trends, such as edge computing, quantum computing, and advanced neural architectures, promise to redefine the capabilities of ${topic}. As open-source communities continue to collaborate on cutting-edge projects, the collective knowledge pool grows, driving the field forward at an unprecedented pace. 
    <br><br>
    Ultimately, the future of ${topic} hinges on interdisciplinary efforts. By combining expertise from fields like computer science, mathematics, ethics, and design, we can create robust solutions that tackle some of the world's most pressing challenges. From healthcare to finance, ${topic} stands poised to revolutionize entire industries, paving the way for a more connected and efficient global ecosystem.
  `.trim();
}

// Generate 30 posts
for (let i = 0; i < 30; i++) {
  const cat = categories[Math.floor(Math.random() * categories.length)];
  posts.push({
    id: nextId++,
    title: `Exploring ${cat.replace('-', ' ')} - Post #${i+1}`,
    date: `2025-04-${(i+1).toString().padStart(2, '0')}`,
    category: cat,
    description: `A deep dive into ${cat.replace('-', ' ')}. This post explores fundamentals, challenges, and future in modern tech.`,
    content: generateBigContent(cat)
  });
}

// Pending user-submitted posts
const pendingPosts = {};
// Comments array
const comments = []; // { postId, name, comment, date }
// Reviews array
const reviews = []; // { name, message, date }

// ------------------------------
// Routes
// ------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/post/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'post.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});
app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'projects.html'));
});
app.get('/submit', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'submit.html'));
});
app.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reviews.html'));
});

// ------------------------------
// API Endpoints
// ------------------------------

// Get posts with optional category/search
app.get('/api/posts', (req, res) => {
  const { category, search } = req.query;
  let filteredPosts = posts;
  if (category && category !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.category === category);
  }
  if (search) {
    const lower = search.toLowerCase();
    filteredPosts = filteredPosts.filter(p =>
      p.title.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }
  res.json(filteredPosts);
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (post) res.json(post);
  else res.status(404).json({ message: "Post not found" });
});

// Comments - get all
app.get('/api/comments/:postId', (req, res) => {
  const postId = parseInt(req.params.postId);
  const postComments = comments.filter(c => c.postId === postId);
  res.json(postComments);
});
// Comments - add
app.post('/api/comments/:postId', (req, res) => {
  const postId = parseInt(req.params.postId);
  const { name, comment } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ message: "Name and comment are required." });
  }
  const newComment = {
    postId,
    name,
    comment,
    date: new Date().toISOString().split("T")[0]
  };
  comments.push(newComment);
  res.json(newComment);
});

// Submit new blog with image
app.post('/api/submit', upload.single('image'), (req, res) => {
  const { name, email, title, category, description, content } = req.body;
  if (!name || !email || !title || !category || !description || !content) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const token = Date.now().toString();
  pendingPosts[token] = {
    id: nextId++,
    title,
    date: new Date().toISOString().split("T")[0],
    category,
    description,
    content,
    image,
    author: name,
    email,
    verified: false
  };
  const verificationURL = `http://localhost:${port}/api/verify?token=${token}`;
  console.log(`Verification email to ${email}: ${verificationURL}`);
  res.json({ message: "Submission received! Check your email for a verification link to publish your post." });
});

// Simulate email verification
app.get('/api/verify', (req, res) => {
  const { token } = req.query;
  const pending = pendingPosts[token];
  if (!pending) {
    return res.status(400).send("Invalid or expired token.");
  }
  pending.verified = true;
  posts.push(pending);
  delete pendingPosts[token];
  res.send("Your blog post has been verified and published. You can now view it on the homepage!");
});

// Reviews - get all
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});
// Reviews - add
app.post('/api/reviews', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ message: "Name and review message are required." });
  }
  const newReview = {
    name,
    message,
    date: new Date().toISOString().split("T")[0]
  };
  reviews.push(newReview);
  res.json(newReview);
});

// Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
