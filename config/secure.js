require("dotenv").config();

const {
  PORT,
  SECURE,
  Cloud_Name,
  Cloud_Key,
  Cloud_Secret,
  TOKEN,
  EMAIL_HOST,
  EMAIL_PASSWORD,
  EMAIL_PORT,
  EMAIL_USERNAME,
} = process.env;

module.exports = {
  PORT,
  SECURE,
  Cloud_Key,
  Cloud_Name,
  Cloud_Secret,
  TOKEN,
  EMAIL_HOST,
  EMAIL_PASSWORD,
  EMAIL_PORT,
  EMAIL_USERNAME,
};
