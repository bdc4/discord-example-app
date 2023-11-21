// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, API_KEY } = require('./config.json');
const axios = require('axios');

const THANKS_STRING = 'This is an automated response thanking you for contributing to Plop’s Foot Pics folder.';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  console.log('message recieved');
  const isImage = await checkForImage(message);
  if (isImage === true) {
    console.log(THANKS_STRING);
    const channel = client.channels.cache.get(message.channelId);
    channel.send(THANKS_STRING);
  }
  //runImageRecognition();
});

// Log in to Discord with your client's token
client.login(token);

async function checkForImage(message) {
  console.log(message.attachments)
  var imageUri;
  try {
    imageUri = message.attachments.at(0).attachment;
    var imgResponses = await runImageRecognition(imageUri);
    imgResponses = imgResponses.data.responses[0].labelAnnotations;
    console.log(imgResponses)
    if (checkListForFeet(imgResponses)) {

      return true;

    } else {
      console.log('No feet!! >:[')
    }
  } catch (e) {
    console.warn('No attachment found, or image recognition failed', e)
  }
}

async function runImageRecognition(imageUri) {
  // check for feet
  const body = {
    "requests": [
      {
        "image": {
          "source": {
            "imageUri": imageUri
          }
        },
        "features": [
          {
            "type": "LABEL_DETECTION",
            "maxResults": 3
          }
        ]
      }
    ]
  }
  const response = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`, body);
  return response;
}

function checkListForFeet(responseList) {
  var hasFeet;
  try {
    const stringList = []
    responseList.forEach(item => {
      stringList.push(item.description)
    });
    const list = stringList.join().toLowerCase();
    hasFeet = hasFeet || list.includes('foot') || list.includes('feet') || list.includes('shoe') || stringList.includes('shoes') || stringList.includes('socks') || stringList.includes('sock')
    return hasFeet;
  } catch (e) {
    console.log("unable to check image")
    console.log(e)
  }
}