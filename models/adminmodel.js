const mongoose = require("mongoose")
const adminschema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
            match: /^[\w-]+(\.[\w-]+)*@gov\.in$/,
        },
        password:{
            type:String,
            required:true
        },
    }
)
const Admin = mongoose.model('Admin', adminschema);