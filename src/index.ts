import { PubSubManager } from "./store"

async function main() {
    const pubSubManager = await PubSubManager.getInstance();
    setInterval(async () => {
        await pubSubManager.addUserToStock("APPL", Math.random().toString())
    }, 5000)
}

main()
