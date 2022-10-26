const https = require("https");
const http = require("https");
const fs = require("fs");
const path = require("path");
const URL = require("url").URL;

function download(url, filepath, filename, callback) {
    const userURL = new URL(url);
    
    const requestCaller = userURL.protocol = "http:" ? http : https;

    const req = requestCaller.get(url, (res) => {
      const fileStream = fs.createWriteStream(path.resolve(filepath, filename));
      res.pipe(fileStream);

      fileStream.on("error", (err) => {
        console.log("Error writting to the stream");
        console.log(err);
      });
    });
}

module.exports.download = download;