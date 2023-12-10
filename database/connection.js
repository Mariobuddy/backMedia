const mongoose = require('mongoose');

const connection=async(url)=>{
   try {
    console.log("Database is connected");
    return mongoose.connect(url);
   } catch (error) {
    return error;
   }
    

}

module.exports=connection;