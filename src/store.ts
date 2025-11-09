import { RedisClient } from "bun";

export class PubSubManager {
    private static instance: PubSubManager
    private redisClient: RedisClient
    private subscriptions: Map<string, string[]>
    private isInitialized: Promise<void>

    private constructor() {
        this.redisClient = new RedisClient();
        this.subscriptions = new Map();
        this.isInitialized = this.initializeRedisClient();
    }

    private async initializeRedisClient() {
        try {
            console.log("Attempting to connect to Redis...");
            await this.redisClient.connect();
            console.log("Redis client connected successfully!");
        } catch (error) {
            console.error("Failed to connect Redis client:", error);
            // You might want to throw the error or handle it more robustly
            throw error;
        }
    }

    public static async getInstance(): Promise<PubSubManager> {
        if (!PubSubManager.instance) {
            PubSubManager.instance = new PubSubManager()
            // Ensure initialization completes before returning the instance
            await PubSubManager.instance.isInitialized;
        }
        return PubSubManager.instance
    }

    async addUserToStock(userId: string, stock: string) {
        // Ensure the client is fully initialized before attempting operations
        await this.isInitialized; // This will await the connection if it hasn't completed yet
        if (!this.subscriptions.has(stock)) {
            this.subscriptions.set(stock, [])
        }
        this.subscriptions.get(stock)?.push(userId)

        if (this.subscriptions.get(stock)?.length === 1) {
            console.log(typeof (stock), userId);
            await this.redisClient.subscribe("ary", (message, channel) => {
                console.log(channel)
                this.forwardMessageToUser(stock, message)
            })
            console.log("Subscribed successfully to stock :" + stock);
        }
    }

    async removerUserFromStock(userId: string, stock: string) {
        // Ensure the client is fully initialized before attempting operations
        await this.isInitialized; // This will await the connection if it hasn't completed yet
        this.subscriptions.set(stock, this.subscriptions.get(stock)?.filter((sub) => sub !== userId) || []);
        if (this.subscriptions.get(stock)?.length === 0) {
            await this.redisClient.unsubscribe(stock)
            console.log("Successfully unsubscribed from this stock :" + stock)
        }
    }

    forwardMessageToUser(stock: string, message: string) {
        console.log('Message recieved on channel for stock :' + stock)
        this.subscriptions.get(stock)?.forEach((sub) => {
            console.log("Sending message of this stock :" + stock + " to user with userId : " + sub + "along with the message : " + message)
        })
    }

    public async disconnect() {
        // Ensure the client is fully initialized before attempting operations
        await this.isInitialized; // This will await the connection if it hasn't completed yet
        this.redisClient.close();
        console.log("Redis client disconnected.")
    }

}
