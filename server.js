const mongoose = require("mongoose");
const app = require("./app");
const dotenv = require("dotenv");

dotenv.config({ path: `${__dirname}/config.env` });

mongoose
  .connect(process.env.DB)
  .then(() => `Connected to the mongodb...`)
  .catch((err) => `Error while connecting to the mongodb ${err.messsage}`);

const PORT = process.env.PORT || 8989;
app.listen(PORT, () => console.log(`Listening on the port ${PORT}`));
