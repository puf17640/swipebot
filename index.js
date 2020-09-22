const Discord = require('discord.js-light'),
	Tinder = require('tinderjs'),
	config = require('dotenv').config()

if (config.error) {
	console.warn('[ERROR]: cannot parse .env file')
	process.exit(-1)
}

const tinder = new Tinder(process.env.AUTH_TOKEN),
	queue = [],
	createEmbed = (opts, embed) => new Discord.MessageEmbed(embed)
		.setTitle(opts.title || '')
		.setAuthor(opts.author && opts.author.name || '', opts.author && opts.author.url || '')
		.setDescription(opts.description || '')
		.setThumbnail(opts.thumbnail)
		.setColor(opts.color)
		.attachFiles(opts.files || [])
		.addFields(opts.fields || [])
		.setImage(opts.image || '')
		.setURL(opts.url || 'https://github.com/puf17640/swipebot')
		.setTimestamp()
		.setFooter(opts.footer || 'Check out the GitHub Repo by clicking the link.')

const client = new Discord.Client({
	presence: {
		status: "online",
		activity: {
			type: 'WATCHING', 
			name: 'people on tinder', 
			url: 'https://github.com/puf17640'
		}
	},
	restTimeOffset: 100,
	partials: ["MESSAGE", "CHANNEL", "REACTION"],
	ws: {
		Intents: ["MESSAGE_CREATE", "MESSAGE_UPDATE"],
	},
	disabledEvents: [
		"GUILD_MEMBER_ADD",
		"GUILD_MEMBER_REMOVE",
		"GUILD_MEMBER_UPDATE",
		"GUILD_MEMBERS_CHUNK",
		"GUILD_INTEGRATIONS_UPDATE",
		"GUILD_ROLE_CREATE",
		"GUILD_ROLE_DELETE",
		"GUILD_ROLE_UPDATE",
		"GUILD_BAN_ADD",
		"GUILD_BAN_REMOVE",
		"GUILD_EMOJIS_UPDATE",
		"GUILD_MESSAGE_REACTIONS",
		"CHANNEL_PINS_UPDATE",
		"CHANNEL_CREATE",
		"CHANNEL_DELETE",
		"CHANNEL_UPDATE",
		"MESSAGE_DELETE",
		"MESSAGE_DELETE_BULK",
		"MESSAGE_REACTION_REMOVE",
		"MESSAGE_REACTION_REMOVE_ALL",
		"MESSAGE_REACTION_REMOVE_EMOJI",
		"USER_UPDATE",
		"USER_SETTINGS_UPDATE",
		"PRESENCE_UPDATE",
		"TYPING_START",
		"VOICE_STATE_UPDATE",
		"VOICE_SERVER_UPDATE",
		"INVITE_CREATE",
		"INVITE_DELETE",
		"WEBHOOKS_UPDATE",
	]
})

const prefix = process.env.PREFIX || '.swipe'

client.once('ready', async () => {
	console.log('[INFO]: bot is running')
	queue.push(...(await tinder.getSwipes()))
})

client.on('message', async message => {
	if (message.author.bot) return;
	message.content = message.content.toLowerCase().replace(prefix, '').trim()
	try {
		if (queue.length === 0) {
			queue.push(...(await tinder.getSwipes()))
		}
		let swipe = queue.splice(0, 1)[0]
		switch(message.content) {
			case 'left':
				await message.channel.send(createEmbed({
					color: '#303136', 
					title: swipe.name,
					image: swipe.photos[0],
					description: swipe.bio,
					fields: [
						{ name: 'Age', value: swipe.age, inline: true },	
						{ name: 'Distance', value: `${swipe.distanceKm.toPrecision(4)} km`, inline: true },	
						{ name: 'Gender', value: ['Male', 'Female', 'Other'][swipe.gender], inline: true },	
						...swipe.teasers.map(teaser => ({ name: teaser.type[0].toUpperCase()+teaser.type.substr(1), value: teaser.string, inline: true }))
					]
				}))
				break;
			case 'right':
				await message.channel.send(createEmbed({
					color: '#303136', 
					title: swipe.name,
					image: swipe.photos[0],
					description: swipe.bio,
					fields: [
						{ name: 'Age', value: swipe.age, inline: true },	
						{ name: 'Distance', value: swipe.distanceKm, inline: true },	
						{ name: 'Gender', value: ['Male', 'Female', 'Other'][swipe.gender], inline: true },	
						...swipe.teasers.map(teaser => ({ name: teaser.type, value: teaser.string, inline: true }))
					]
				}))
				break;
		}
	}catch(err){
		console.error(`'${err.message}' on channel ${message.channel.id} in guild ${message.guild.id}`)
	}
})

client.login(process.env.TOKEN)