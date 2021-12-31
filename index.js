const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const prefix = ("*");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
  client.user.setActivity(" my script | *help ", {type:"LISTENING"})
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});




client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
    
  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play` || `${prefix}p`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pause`)) {

    pause(message, serverQueue);
  }else if (message.content === prefix + 'help') {
    
    
    var musicembed = new Discord.MessageEmbed()
    .setTitle("Music : ")
    .setColor("FF0000")
    .setAuthor("Commands")
    .setDescription("*play ** : play music , ex : *play youtube.com...** \n *skip ** : skip music** \n *stop ** : stop music** \n *pause ** : pause music, :warning: to resume the music you must also write *pause ! **")


    message.channel.send(musicembed)


  }else if (message.content.startsWith(prefix +"clear")) {
    try {
        if (message.member.hasPermission("MANAGE_MESSAGES")) {
          let args = message.content.split(" ");
            messages = args[1]
            message.channel.bulkDelete(messages);
            message.channel.send(":white_check_mark: " + messages + " messages were deleted").then(msg => {
              msg.delete({ timeout: 3000 })
            })
            .catch(console.error);

        }
    } catch(e) {
        message.channel.send("ERROR: ERROR CLEARING CHANNEL.");
        console.log(e);
    }

  

  }else if (message.content.startsWith(`${prefix}listplay`)) {
let msg = "**List** \n";
for(var i = 0;i < queue.length;i++) {
  let name;
  await ytdl.getInfo(queue[i], (err, info) => {
    if(err) {
      console.log("error link : " + err);
      queue.slice(i, 1);
    }else {
      name = info.title
    }
  })
  msg += "> " + i + " - " + name + "\n"
}
message.channel.send(msg)
  
  }else{


    message.channel.send("You need to enter a valid command!");

    
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");
  if(args[1] == undefined || !args[1].startsWith("https://www.youtube.com/watch?v=")) {
  message.channel.send("You need send a valid Link !");
}else {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }

}
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel)
      return message.channel.send("You have to be in a voice channel to stop the music!");
  
      if (serverQueue.connection.dispatcher.paused) {
        serverQueue.connection.dispatcher.resume();
        message.reply(":play_pause: Replayed");
    } else {
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.pause();
        message.reply(":play_pause: Paused");
    }
    
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You have to be in a voice channel to stop the music!");

  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
    message.reply(":arrow_forward::arrow_forward: Skipped");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You have to be in a voice channel to stop the music!");
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.reply(":stop_button: Stopped");
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }




  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}


const token = '' 
client.login(process.env.token);


