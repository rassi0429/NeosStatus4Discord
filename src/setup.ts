import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"

export function setUpCommand(serverID: string, applicationId: string, token: string) {
    // Discord command params
    const commands = [{
        name: 'setrole',
        description: 'ユーザに付与されるロールを設定します',
        options: [
            {
                name: "state",
                required: true,
                description: "状態",
                type: 3,
                choices: [
                    {
                        "name": "Online",
                        "value": "online"
                    },
                    {
                        "name": "Offline",
                        "value": "offline"
                    }
                ]
            },
            {
                name: "role",
                required: true,
                description: "割り当てる役職",
                type: 8
            }
        ]
    }, {
        name: 'setuserid',
        description: 'Neosのユーザ名を設定します',
        options: [
            {
                name: "userid",
                required: true,
                description: "ユーザID(U-から始まる)",
                type: 3
            },
            {
                name: "discord",
                required: false,
                description: "ユーザ(Discord)",
                type: 6
            }
        ]
    },{
        name: 'removeuser',
        description: '監視を解除します',
        options: [
            {
                name: "discord",
                required: false,
                description: "ユーザ(Discord)",
                type: 6
            }
        ]
    }, {
        name: 'status',
        description: 'Neosのユーザのステータスを取得します',
        options: [
            {
                name: "userid",
                required: false,
                description: "ユーザID(U-から始まる)",
                type: 3
            },
            {
                name: "discord",
                required: false,
                description: "ユーザ(Discord)",
                type: 	6
            }
        ]
    }, {
        name: 'list',
        description: 'サーバに設定されているユーザのリストを返します・',
        options: [
        ]
    }]
    const rest = new REST({ version: '9' }).setToken(token);
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(applicationId, serverID),
                { body: commands },
            );

                
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();

}