const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();
const uris = process.env.DB_URIS;

mongoose.connect(uris, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

module.exports = User;
