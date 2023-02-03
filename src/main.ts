import {Connection, ConnectionOptions, createConnection} from "typeorm";
import {User} from "./entity/user";
import {Server} from "./entity/server";
import {Client, GuildMember, Intents} from "discord.js"
import {BaseCommandInteraction, Interaction, Message} from "discord.js";
import {setUpCommand} from "./setup";
import axios from "axios"

const options: ConnectionOptions = {
    type: "sqlite",
    database: "./db/db.sqlite3",
    entities: [User, Server],
    synchronize: false,
};

let connection: Connection | null = null;

async function connectDB() {
    connection = await createConnection(options);
    await connection.query("PRAGMA foreign_keys=OFF");
    await connection.synchronize();
    await connection.query("PRAGMA foreign_keys=ON");
}

connectDB().then(async () => {
    await updateUserState()
})

const discord_token = process.env.DISCORD_TOKEN

if (!discord_token) {
    throw new Error("DISCORD_TOKEN_NOT_PROVIDED")
}

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.on('ready', async (client) => {
    console.log(`Logged in as ${client.user?.tag}!`);
    setUpCommand("606109479003750440", client.application.id , discord_token)
    const serverRepository = await connection?.getRepository(Server)
    const servers = await serverRepository?.find()
    servers?.forEach(server => {
        setUpCommand(server.serverId, "930277128212217926", discord_token)
    })
});

client.on("guildCreate", guild => {
    setUpCommand(guild.id, "930277128212217926", discord_token)
})

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;
    console.log(interaction.commandName)
    const serverRepository = await connection?.getRepository(Server)
    const userRepository = await connection?.getRepository(User)
    if (!serverRepository) {
        return
    }
    if (!userRepository) {
        return
    }

    switch (interaction.commandName) {
        case "status":
            let userId = interaction.options.get("userid")?.value
            const discord = interaction.options.get("discord")?.value
            if (!userId && !discord) {
                await interaction.reply("UserIdかDiscordアカウントを指定してください")
                break
            }
            if (discord) {
                const user = await userRepository.findOne({where: {discordId: discord}})
                userId = user?.neosUserId
            }
            try {
                const {data} = await axios.get(`https://api.neos.com/api/users/${userId}/status`)
                await interaction.reply(`${userId}さんのNeosのステータス : ${getEmoji(data.onlineStatus)} ${data.onlineStatus}`)
            } catch {
                await interaction.reply("エラーが発生しました。たぶんユーザがおらん")
            }
            break;
        case "setrole":
            if (interaction.user.id !== interaction.guild?.ownerId) {
                await interaction.reply("権限がありません")
                return
            }
            const role = interaction.options.get("role")?.value + ""
            switch (interaction.options.get("state")?.value) {
                case "online":
                    await serverRepository?.save({serverId: interaction.guildId || "", onlineRole: role})
                    break
                case "offline":
                    await serverRepository?.save({serverId: interaction.guildId || "", offlineRole: role})
                    break
            }
            await interaction.reply("OK")
            break;
        case "setuserid":
            const neosuserid = interaction.options.get("userid")?.value + ""
            const discordId = (interaction.options.get("discord")?.value || "") + ""
            let server = await serverRepository.findOne({where: {serverId: interaction.guildId}, relations: ["users"]})
            if (!server) {
                await interaction.reply("Botの初期設定が完了していないようです。サーバ管理者に報告してください。")
                return
            }
            let user = await userRepository.findOne({where: {discordId: discordId || interaction.user.id}})
            if (!user) {
                const newUser = await userRepository.save({
                    discordId: discordId || interaction.user.id,
                    neosUserId: neosuserid
                })
                server.users.push(newUser)
                await serverRepository?.save(server)
                const reply = await interaction.reply({content: 'OK', fetchReply: true})
                setTimeout(() => {
                    if ((reply as Message).deletable) {
                        (reply as Message).delete()
                    }
                }, 5000)
                return
            }
            server.users.push(user)
            await serverRepository?.save(server)
            user.neosUserId = neosuserid
            await userRepository.save(user)
            await interaction.reply("OK")
            break
        case "removeuser":
            const discordId2 = (interaction.options.get("discord")?.value || "") + ""
            let server2 = await serverRepository.findOne({where: {serverId: interaction.guildId}, relations: ["users"]})
            if (!server2) {
                await interaction.reply("Botの初期設定が完了していないようです。サーバ管理者に報告してください。")
                return
            }
            let user2 = await userRepository.findOne({where: {discordId: discordId2 || interaction.user.id}})
            if(user2) {
                const newUsers = server2.users.filter(u => u.discordId !== discordId2)
                await serverRepository.save({
                    ...server2,
                    users: newUsers
                })
                if (server2.onlineRole) {
                    const discordServer = await client.guilds.fetch(server2.serverId)
                    const discordUser: GuildMember | undefined | null = await discordServer.members.fetch(user2.discordId)
                    if (!discordUser) {
                        await interaction.reply("ゆーざが存在しないようです")
                        return
                    }
                    await discordUser.roles.remove(server2.onlineRole)
                    if (server2.offlineRole) {
                        await discordUser.roles.remove(server2.offlineRole)
                    }
                }
            }
            await interaction.reply("OK")
            break
        case "list":
            await interaction.deferReply();
            const s = await serverRepository.findOne({where: {serverId: interaction.guildId}, relations: ["users"]})
            // console.log(s)
            const result = await Promise.all(s?.users.map(async (u) => {
                try {
                    const status = getEmoji(u.neosStatus)
                    const gUser = await interaction.guild?.members.fetch(u.discordId)
                    const userTag = await gUser?.user.tag
                    return `${status} ${u.neosUserId} (${userTag || "???"})`
                } catch {
                    return ""
                }
            }) || ["なんかバグってそう"])
            if(result.filter((r) => !!r).length !== 0) {
                await interaction.editReply(result.filter((r) => !!r).join("\n"))
            } else {
                await interaction.editReply("ユーザが見つかりません。")
            }
            break
        default:
            break;
    }
})

async function updateUserState() {
    console.log("updateUserState")
    const url = (userId: string) => `https://api.neos.com/api/users/${userId}/status`
    const userRepository = await connection?.getRepository(User)
    if (!userRepository) return
    const users = await userRepository.find({relations: ["servers"]})
    for (let user of users) {
        if (!user.neosUserId) continue;
        if (user.servers.length == 0) continue;
        try {
            const {data} = await axios.get(url(user.neosUserId))
            user.neosStatus = data.onlineStatus
            await userRepository.save(user)
            for (let server of user.servers) {
                if (server.onlineRole) {
                    const discordServer = await client.guilds.fetch(server.serverId)
                    const discordUser: GuildMember | undefined | null = await discordServer.members.fetch(user.discordId)
                    if (!discordUser) continue
                    if (data.onlineStatus == "Offline") {
                        await discordUser.roles.remove(server.onlineRole)
                    } else {
                        await discordUser.roles.add(server.onlineRole)
                    }
                    if (server.offlineRole) {
                        if (data.onlineStatus == "Offline") {
                            await discordUser.roles.add(server.offlineRole)
                        } else {
                            await discordUser.roles.remove(server.offlineRole)
                        }
                    }
                }
            }
        } catch (e) {
            // console.log(e)
        } finally {
            await sleep(500)
        }
    }
}

setInterval(() => updateUserState(), 3 * 60 * 1000)

const sleep = (time: number) => {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

function getEmoji(s: string) {
    let status = "🔴"
    switch (s) {
        case "Online":
            status = "🟢"
            break
        case "Busy":
            status = "🔴"
            break
        case "Away":
            status = "🟡"
            break
        case "Invisible":
            status = "⚪"
            break
        case "Offline":
            status = "⚪"
            break
    }
    return status
}


client.login(discord_token);