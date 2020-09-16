# Classic WoW World Buff Server

Application collects data for Classic WoW world buff timers (Onyxia, Nefarian, Rend) from all realms and factions.
Data are collected from clients which will upload timers to server. Timers are stored in Redis and published using discord bot.
[More info about clients is available here](https://github.com/techi602/wb-client)

## Discord bot installation

You can add bot to your channel using [existing discord bot](https://discord.com/api/oauth2/authorize?client_id=754343634496651295&permissions=67584&scope=bot). Bot requires only permissions for reading and sending messages.
[More info about bot here](https://discord.com/developers/applications/754343634496651295/information).
To get the current timers from the bot simply type "wb" into the channel.
If you want to host your own server and bot see installation section.

## Installation

Server is intended to run online. [Currently hosted here on Heroku](https://classic-wb-server.herokuapp.com/)
However you can still host this server on your own. All clients must be configured as well to upload data to given address. 

All you have to do is setup ENV variables for DISCORD_TOKEN and setup redis with REDIS_URL

## Issues

I currently only support Zandalar Tribe realm for Horde during testing. More realms must be allowed explicitly in code. However server is intended to host data from all realms and factions. But since I struggle with different timezones on wow clients and wow servers I have to decided to start support only EU servers first. Currently server is running on UTC+2 timezone. 
