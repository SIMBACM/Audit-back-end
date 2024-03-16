const mongoose=require("mongoose")
const registerschema=new mongoose.Schema(
    {
        username:String,
        email:String,
        password:String,
        confirm_password:String
    

    }
)
module.exports=mongoose.model("users",registerschema)