const express = require("express")
const router = express.Router()

const users = []

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
        return res.status(400).json({ message: "Email already registered" })
    }

    const newUser = { id: users.length + 1, name, email, password }
    users.push(newUser)

    res.status(201).json({ message: "Account created successfully!" })
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const user = users.find(u => u.email === email && u.password === password)
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" })
    }

    res.status(200).json({ message: "Login successful!", user: { id: user.id, name: user.name, email: user.email } })
})

module.exports = router
