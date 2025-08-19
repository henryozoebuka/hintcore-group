import PostModel from "../models/postModel.js";
import UserModel from '../models/userModel.js';

const createPost = async (req, res) => {
    const { title, body, category, tags, author, published } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your post must have a title and body content to continue.' });
    }

    try {
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Attempt to create a new post
        const newPost = await PostModel.create({ title, author, body, category, published, tags, thumbnail: req.file ? req.file.location : null, });

        if (!newPost) {
            return res.status(500).json({ message: 'Something went wrong while posting. Please try again later.' });
        }

        // Success response
        res.status(201).json({ message: 'Post created successfully!' });
    } catch (error) {
        // Log error details for debugging
        console.error('Error creating post:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch posts
const fetchPosts = async (req, res) => {

    try {
        const posts = await PostModel.find()
            .populate('author', 'firstname lastname');
        if (!posts) {
            return res.status(404).json({ message: 'No posts found.' })
        }
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//edit post
const editPost = async (req, res) => {
    const { title, body, category, tags, published, thumbnail } = req.body;
    const postId = req.params.id;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your post must have a title and body content to continue.' });
    }
    try {
        // Check if the post exists first
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Update the post
        await PostModel.findByIdAndUpdate(postId, {
            title,
            body,
            category,
            published,
            tags,
            thumbnail: req.file ? req.file.location : thumbnail ? thumbnail : null,
        });

        // Success response
        res.status(200).json({ message: 'Post updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error updating post: ${error.message}` });
    }
};

//delete user account
const deletePost = async (req, res) => {
    const id = req.params.id;
    try {
        const deletedPost = await PostModel.findByIdAndDelete(id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' })
    }
}

const deletePosts = async (req, res) => {
    const { posts } = req.body;  // Array of post IDs to delete
    try {
        // Ensure the 'posts' is an array and contains valid ObjectIds
        if (!Array.isArray(posts) || posts.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of post IDs to delete.' });
        }

        // Use deleteMany to delete posts by their IDs
        const deletedPosts = await PostModel.deleteMany({ _id: { $in: posts } });

        if (deletedPosts.deletedCount === 0) {
            return res.status(404).json({ message: 'No posts found to delete.' });
        }

        res.status(200).json({ message: `${deletedPosts.deletedCount} posts deleted successfully.` });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' });
    }
};


export { createPost, fetchPosts, editPost, deletePost, deletePosts };