const express = require("express");
const path = require("path");
const cors = require("cors");
const ytdl = require("ytdl-core");
const app = express();

const ffmpeg2 = require('fluent-ffmpeg');

const cp = require("child_process");
const ffmpeg = require("ffmpeg-static");
const { application } = require("express"); 

app.use(cors());
app.listen(4000, () => {
  console.log("server works !! at post 4000");
});

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../index.html"))
//   console.log(path.join(__dirname, "index.html"))
// })

app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "../public")));

app.get("/download", (req, res) => {
  let URL = req.query.URL;

  //   res.header("Content-Disposition", 'attachment; filename="video.mp4"');
  //   ytdl(URL, {format: "mp4"}).pipe(res);
  console.log(URL);

  // ytdl(URL)
  //   .pipe(fs.createWriteStream('video.mp4'));
  //

  console.log(ytdl.getInfo(URL));
});

app.post("/youtube", async (req, res) => {
  const url = req.body.url;
  console.log(req.body);

  let info = await ytdl.getInfo(url);
  let title = encodeURI(info.videoDetails.title);
  console.log(title);
  console.log(encodeURI(title));
  res.header(`Content-Disposition`, `attachement; filename="${title}".mp4`);

  let video = ytdl(url, { filter: "videoonly" });
  let audio = ytdl(url, { filter: "audioonly", highWaterMark: 1 << 25 });

  console.log(ffmpeg);

  const ffmpegProcess = cp.spawn(
    ffmpeg,
    [
      "-i",
      `pipe:3`,
      "-i",
      `pipe:4`,
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      "libmp3lame",
      "-crf",
      "27",
      "-preset",
      "veryfast",
      "-movflags",
      "frag_keyframe+empty_moov",
      "-f",
      "mp4",
      "-loglevel",
      "error",
      "-",
    ],
    {
      stdio: ["pipe", "pipe", "pipe", "pipe", "pipe"],
    }
  );

  video.pipe(ffmpegProcess.stdio[3]);
  audio.pipe(ffmpegProcess.stdio[4]);
  ffmpegProcess.stdio[1].pipe(res);

  let ffmpegLogs = "";

  ffmpegProcess.stdio[2].on("data", (chunk) => {
    ffmpegLogs += chunk.toString();
  });

  ffmpegProcess.on("exit", (exitCode) => {
    if (exitCode === 1) {
      console.error(ffmpegLogs);
    }
  });

  // ytdl
  //   .getBasicInfo(url)
  //   .then( info => {
  //     console.log(info.videoDetails.title)
  //     const title = info.videoDetails.title
  //     res.header(`Content-Disposition`,`attachement; filename=${title}.mp4` );

  //     ytdl(url, {
  //       quality: "137",
  //       format: "mp4"
  //     }).pipe(res)
  //   })
  //   .catch((err) => console.log(err));
});

app.post("/convert", async (req, res) => {
  const url = req.body.url;
  console.log(req.body);
  let info = await ytdl.getInfo(url);
  let title = encodeURI(info.videoDetails.title);
  console.log(title);
  console.log(encodeURI(title));
  res.header(`Content-Disposition`, `attachment; filename="${title}.mp3"`);

  let audioStream = ytdl(url, { filter: "audioonly" });
  let ffmpegProcess = new ffmpeg2(audioStream)
    .toFormat('mp3')
    .audioBitrate(320)
    .on('end', function() {
      console.log('Finished converting audio');
    })
    .on('error', function(err) {
      console.log('Error while converting audio: ' + err.message);
    });

  ffmpegProcess.pipe(res);
})

