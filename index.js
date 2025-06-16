import express from 'express'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient();
const app = express()
app.use(express.json())

// Create user
app.post("/users", async (req, res) => {
    const { firstName, lastName, emailAddress, username } = req.body

    try {
        const existsingUser = await client.users.findFirst({
            where: {
                OR:[
                    { username: username },
                    { emailAddress: emailAddress }
                ]
            }
        })
        if (existsingUser){
            return res.status(409).json({ message: `User already exists`})
        }
        const newUser = await client.users.create({
            data: {
                firstName,
                lastName,
                emailAddress,
                username
            }
        })
        res.status(201).json({ message: `User created successfully.`, User: newUser})
    }catch (e)  {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// fetch all users
app.get("/users", async (_req, res) => {
    try {
        const allUsers = await client.users.findMany({
            where: {
                isDeleted: false
            }
        })
        res.status(200).json({ message: `Fetched all users successfully.`, users: allUsers})
    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

// Fetch specific user
app.get("/users/:id", async (req, res) => {
    const { id } = req.params

    try {
        const userInfo = await client.users.findFirst({
            where: {
                AND:[
                    { id: id },
                    { isDeleted: false}
                ]
            }
        })

        if (userInfo) {
            res.status(200).json({ message: `Fetched user successfully.`, user: userInfo})
        }else {
            res.status(404).json({ message: `User not found.`})
        }

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Delete user
app.delete("/users/:id", async (req, res) => {
    const { id } = req.params

    try {
        const userInfo = await client.users.update({
            where:{
                id
            },
            data:{
                isDeleted: true
            }
        })
        const userPosts = await client.posts.updateMany({
            where: {
                user_id: id
            },
            data: {
                isDeleted: true
            }
        })
        if (userInfo) {
            res.status(200).json({ message: `User and related posts successfully deleted.`})
        }else {
            res.status(404).json({ message: `user not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Update user
app.put("/users/:id", async (req, res) => {
    const { id } = req.params
    const { firstName, lastName, emailAddress, username } = req.body

    try {
        const exists = await client.users.findFirst({
            where: {
                AND: [
                    { id: id },
                    { isDeleted: false}
                ]
            }
        })

        if (!exists) {
            return res.status(404).json({ message: `User not found.`})
        }
        const existsingUser = await client.users.findFirst({
            where: {
                OR:[
                    { emailAddress: emailAddress },
                    { username: username }
                ]
            }
        })
        if (existsingUser) {
            return res.status(409).json({ message: `User with  supplied Email Address OR Username already esists.`})
        }
        const userInfo = await client.users.update({
            where:{
                id
            },
            data: {
                firstName: firstName && firstName,
                lastName: lastName && lastName,
                emailAddress: emailAddress && emailAddress,
                username: username && username
            }
        })
        if (userInfo) {
            res.status(200).json({ message: `Successfully updated user details.`, user: userInfo})
        }else {
            res.status(400).json({ message: `Failed to update user, please try again.`})
        }

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Create post
app.post("/posts", async (req, res) => {
    const { title, content, userId } = req.body

    try {
        const newPost = await client.posts.create({
            data: {
                title : title,
                content: content,
                user_id: userId
            }
        })
        res.status(201).json({ message: `Post created successfully.`, post: newPost})

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Fetch all posts
app.get("/posts", async (_req, res) => {
    try {
        const allPosts = await client.posts.findMany({
            where: {
                isDeleted: false
            }, 
            include: {
                user: true
            }
        })
        res.status(200).json({ message: `Fetched all posts successfully.`, posts: allPosts})
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Fetch specific post 
app.get("/posts/:id", async (req, res) => {
    const { id } = req.params

    try {
        const postInfo = await client.posts.findFirst({
            where: {
                AND: [
                    { id },
                    { isDeleted: false }
                ]
            },
            include:{
                user: true
            }
        })
        res.status(200).json({ message: `Fetched post successfully.`, post: postInfo})

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Fetch all posts for a specific user
app.get("/users/:id/posts", async (req, res) => {
    const { id } = req.params
    try {
        const exists = await client.users.findFirst({
            where: {
                AND: [
                    { id: id },
                    { isDeleted: false }
                ]
            }
        })
        if (!exists) {
            return res.status(404).json({ message: `User not found.`})
        }
        const userPosts = await client.posts.findMany({
            where: {
                AND: [
                    { user_id: id },
                    { isDeleted: false}
                ]
            }
        })
        if (userPosts) {
            res.status(200).json({ message: `Fetched all user posts`, userPosts})
        }else {
            res.status(400).json({ message: `Failed to fetch user posts.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Delete specific post
app.delete("/posts/:id", async (req, res) => {
    const { id } = req.params

    try {
        const exists = await client.posts.findFirst({
            where: {
                AND: [
                    { id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return res.status(404).json({ message: `Post not found.`})
        }

        const postInfo = await client.posts.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        })
        if (postInfo) {
            res.status(200).json({ message: `Post successfully deleted.`})
        }else {
            res.status(400).json({ message: `Failed to delete post, please try again.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Update posts
app.put("/posts/:id", async (req, res) => {
    const { id } = req.params
    const { title, content } = req.body

    try {
        const exists = await client.posts.findFirst({
            where: {
                AND : [
                    { id: id },
                    { isDeleted: false }
                ]
            }
        })
        if (!exists) {
            res.status(404).json({ message: `Post not found.`})
        }
        const postInfo = await client.posts.update({
            where: {
                id 
            }, 
            data: {
                title: title && title,
                content: content && content
            }
        })
        if (postInfo) {
            res.status(200).json({ message: `Post updated successfully.`, post: postInfo})
        }else {
            res.status(400).json({ message: `Failed to update post.`})
        }
    }catch (e) {
        res.status(500).json({ message : `Something went wrong.`})
    }
})

// Create comment
app.post("/posts/:id/comments", async (req, res) => {
    const { postId } = req.params
    const { content, authorId } = req.body

    try {
        const newComment = await client.comments.create({
            data: {
                content,
                authorId,
                postId
            }
        })
        if (newComment) {
            res.status(201).json({ message: `Comment made successfully.`, comment: newComment})
        }else {
            res.status(400).json({ message: `Comment not made, please try again.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Fetch all comments 
app.get("/comments", async (_req, res) => {
    try {
        const allComments = await client.comments.findMany({
            where: {
                isDeleted: false
            }
        })
        res.status(200).json({ message: `Fetched all comments.`, comments: allComments})
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

//Fetch specific comment
app.get("/comments/:id", async (req, res) => {
    const { id } = req.params

    try {
        const comment = await client.comments.findFirst({
            where: {
                AND: [
                    { id: +id },
                    { isDeleted: false }
                ]
            }
        })
        if (comment) {
            res.status(200).json({ message: `Fetched comment succesfully.`, comment: comment})
        }
    }catch (e) {
        res.status(500).json({ message: `Somethign went wrong.`})
    }
})

//Fetch all comments made on a post
app.get("/posts/:id/Comments", async (req, res) => {
    const { id } = req.params
    
    try {
        const exists = await client.posts.findFirst({
            where: {
                AND: [
                    { id: id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return res.status(404).json({ message: `Post not found.`})
        }
        const postComments = await client.comments.findMany({
            where:{
                AND: [
                    { postId: id },
                    { isDeleted: false }
                ]
            }
        })
        if (postComments) {
            res.status(200).json({ message: `Fetched all comments for the post.`, comments: postComments})
        }else {
            res.status(404).json({ message: `Post not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

//Fetch all comments that a specific user has made
app.get("/users/:id/comments", async (req, res) => {
    const { id }  = req.params

    try {
        const exists = await client.users.findFirst({
            where: {
                AND: [
                    { id: id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return res.status(404).json({ message: `User not found.`})
        }

        const userComments = await client.comments.findMany({
            where: {
                AND: [
                    { authorId: id },
                    { isDeleted: false }
                ]
            }
        })
        if (userComments) {
            res.status(200).json({ message: `Fetched all user comments.`, comments: userComments})
        }else {
            res.status(404).json({ message: `User not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

//Fetch all posts of a specific user and the related comments
app.get("/users/:id/posts/comments", async (req, res) => {
    const { id } = req.params

    try {
        const exists = await client.users.findFirst({
            where: {
                AND: [
                    { id: id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return res.status(404).json({ message: `User not found.`})
        }

        const userPostsAndComments = await client.posts.findMany({
            where: {
                AND: [
                    { user_id: id },
                    { isDeleted: false}
                ]
            },
            include: {
                comments
            }
        })
        if (userPostsAndComments) {
            res.status(200).json({ message: `Fetched all posts and related comments.`, posts: userPostsAndComments})
        }else {
            res.status(404).json({ message: `User posts not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

//Update comment 
app.put("/comments/:id", async (req, res) => {
    const { id } = req.params
    const { content } = req.body

    try {
        const exists = await client.comments.findFirst({
            where: {
                AND: [
                    { id: +id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return req.status(404).json({ message: `Comment not found.`})
        }
        const comment = await client.comments.update({
            where: {
                AND: [
                    { id: +id },
                    { isDeleted: false }
                ]
            },
            data: {
                content: content && content
            }
        })
        if (comment) {
            res.status(200).json({ message: `Comment updated successfully.`, comment: comment})
        } else {
            return res.status(404).json({ message: `Comment not found.`})
        }
        
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

// Delete comment
app.delete("/comments/:id", async (req, res) => {
    const { id } = req.params

    try {
        const exists = await client.comments.findFirst({
            where: {
                AND: [
                    { id: +id },
                    { isDeleted: false}
                ]
            }
        })
        if (!exists) {
            return req.status(404).json({ message: `Comment not found.`})
        }
        const comment = await client.comments.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        })
        if(comment) {
            res.status(200).json({ message: `Comment deleted successfully.`})
        }else {
            res.status(404).json({ message: `Comment not found.`})
        }

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`Server up and listening on port ${port}`)
})
