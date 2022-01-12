import typeorm, {
    Column,
    Entity,
    ManyToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Server } from "./server";

@Entity("User")
export class User {

    @PrimaryColumn({ type: "text", default: null, unique: false })
    discordId: string;

    @Column({ type: "text", default: null, unique: false })
    neosUserId: string;

    //"Offline" "Invisible" "Away" "Busy" "Online"
    @Column({ type: "text", default: "Offline" })
    neosStatus: string;

    @ManyToMany(() => Server, server => server.users)
    servers: Server[];
}