import typeorm, {
    Column,
    Entity,
    JoinTable,
    ManyToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";

@Entity("Server")
export class Server {
    @PrimaryColumn({ type: "text" ,unique: true})
    serverId: string;

    @Column({ type: "text", default: "" })
    onlineRole: string;

    @Column({ type: "text", default: "" })
    offlineRole?: string;

    @ManyToMany(() => User, user => user.servers)
    @JoinTable()
    users: User[];
}