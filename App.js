const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const registerrouter=require("./controllers/registerrouter")

const app = express()

app.use(express.json())
app.use(cors())
mongoose.connect("mongodb+srv://Ajay2001:Vijay2002@cluster0.dbzbjyk.mongodb.net/registerDb?retryWrites=true&w=majority&appName=Cluster0",
{useNewUrlParser:true})


app.use("/register",registerrouter)


app.listen(3001,()=>{
    console.log("server is running")
})