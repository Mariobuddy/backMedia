const otproute = require("express").Router();
const {sendOtp} =require("../controller/otp")

otproute.post("/sendotp",sendOtp);

module.exports=otproute;
