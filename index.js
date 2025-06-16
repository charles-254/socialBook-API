import express from 'express'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient();
const app = express()
app.use(express.json())

app.get("/", (_req, res) => {
    res.send("<h1> Welcome to my social book API.</h1>")
})
app.post("/users", async (req, res) => {
    const { firstName, lastName, emailAddress, username } = req.body

    try {
        const exists = await client.users.findFirst({
            where: {
                OR: [
                    { emailAddress },
                    { username }
                ]
            }
        })
        if (exists) {
            return res.status(409).json({ message: `User already exists.`})
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

app.get("/users", async (_req, res) => {
    try {
        const allUsers = await client.users.findMany({
            include: {
                post : true
            }
        })
        res.status(200).json({ message: `Fetched all users and related posts successfully.`, users: allUsers})
    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

app.get("/users/:id", async (req, res) => {
    const { id } = req.params

    try {
        const userInfo = await client.users.findFirst({
            where: {
                id 
            },
            include: {
                post: true
            }
        })
        if (userInfo) {
            res.status(200).json({ message: `Fetched user successfully.`, user: userInfo})
        }else {
            res.status(404).json({ message: `User not found.`})
        }

    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

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
        if (postInfo) {
            res.status(200).json({ message: `Fetched post successfully.`, post: postInfo})
        }else {
            res.status(404).json({ message: `Post not found`})
        }

    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

app.delete("/posts/:id", async (req, res) => {
    const { id } = req.params

    try {
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
            res.status(404).json({ message: `Post not found`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

app.put("/posts/:id", async (req, res) => {
    const { id } = req.params
    const { title, content } = req.body
    try {
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
            res.status(400).json({ message: `Post not found.`})
        }
    }catch (e) {
        res.status(500).json({ message : `Something went wrong`})
    }
})

const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`Server up and listening on port ${port}`)
})

