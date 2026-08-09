import { createClient } from "redis";


class RedisClient {
    constructor () {
        this.client = null;

    }

    async connectClient() {

        if (this.client?.isOpen) {
            return this.client;
        }

        if (!this.client) {
            this.client = createClient({
                url: process.env.REDIS_URL,
            });

            this.client.on("error", (err) => {
                console.error("Redis Error:", err);
            });

            await this.client.connect();
            console.log("✅ Redis connected");
        }

        return this.client;
    }
}

const redisClient = new RedisClient();

export default redisClient;