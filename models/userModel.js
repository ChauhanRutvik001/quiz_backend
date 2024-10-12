import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
        unique: true
    },
    password:{
        type:String,
        require:true
    },
    gender:{
        type:String
    },
    location:{
        type:String
    },
    birthday:{
        type:Date
    },
    github:{
        type:String
    },
    skills:{
        type:String
    },
    education:{
        type:String
    },
    linkedIn:{
        type:String
    },
    profilePicture: {
        type: String,
        default: "https://png.pngtree.com/png-clipart/20220213/original/pngtree-avatar-bussinesman-man-profile-icon-vector-illustration-png-image_7268049.png"  // Default picture URL if none is provided
    }

},{timestamps:true});

export const User = mongoose.model("User", userSchema);
export default mongoose.model("User", userSchema);