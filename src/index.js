const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/:route', (req, res) => {
  try {
    const alHandler = require(`./handlers/${req.params.route}`);
    if (!alHandler) {
      return res.status(404).json({
        message: `not found`
      });
    }
    return alHandler(req, res);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: `unexpected error occured`
    });
  }
});

app.listen(PORT);
