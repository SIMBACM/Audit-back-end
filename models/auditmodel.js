const mongoose = require("mongoose")
const auditschema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
            match: /^[\w-]+(\.[\w-]+)*@gov\.com$/,
        },
        password:{
            type:String,
            required:true
        },
    }
)
const audit = mongoose.model('Audit', auditschema);