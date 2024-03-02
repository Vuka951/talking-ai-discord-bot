const fs = require("fs");
const prism = require("prism-media");
const { AISetup } = require("../services/vertex-ai");

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmdirSync(folderPath, { recursive: true });
    console.log(`Folder ${folderPath} has been deleted.`);
  } else {
    console.log(`Folder ${folderPath} does not exist.`);
  }
}

function createFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Folder ${folderPath} has been created.`);
  } else {
    console.log(`Folder ${folderPath} already exist.`);
  }
}

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("🤢Error deleting file:", err);
    } else {
      console.log("🗑️File deleted successfully:", filePath);
    }
  });
}

function createOggStream() {
  return new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 1,
      sampleRate: 16000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });
}

function startUp() {
  // Cleans up and creates a new folder
  deleteFolder("./audio");
  createFolder("./audio");
  AISetup();
}

module.exports = {
  deleteFolder,
  deleteFile,
  createFolder,
  createOggStream,
  startUp,
};
