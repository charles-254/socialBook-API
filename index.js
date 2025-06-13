import express from 'express'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient();
const app = express()
app.use(express.json())


app.post("/users", async (req, res) => {
    console.log(req.body)
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
            return res.status(400).json({ message: `User already exists`})
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
            where: {
                isDeleted: false
            }
        })
        res.status(200).json({ message: `Fetched all users successfully.`, users: allUsers})
    }catch (e) {
        res.status(500).json({ message: `Something went wrong`})
    }
})

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
            res.status(400).json({ message: `user not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
    }
})

app.put("users/:id", async (req, res) => {
    const { id } = req.params
    const { firstName, lastName, emailAddress, username } = req.body

    try {
        const existsingUser = await client.users.findFirst({
            where: {
                OR:[
                    { emailAddress: emailAddress },
                    { username: username }
                ]
            }
        })
        if (existsingUser) {
            return res.status(400).json({ message: `User with email address ${emailAddress} OR username ${username} already esists.`})
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

    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
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
                id
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

app.get("/users/:id/posts", async (req, res) => {
    const { id } = req.params
    try {
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
            res.status(404).json({ message: `User not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
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
            res.status(404).json({ message: `Post not found.`})
        }
    }catch (e) {
        res.status(500).json({ message: `Something went wrong.`})
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
        res.status(500).json({ message : `Something went wrong.`})
    }
})

const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`Server up and listening on port ${port}`)
})

