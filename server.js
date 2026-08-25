import "dotenv/config";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import app from "./src/app.js";
import { databaseConnection } from "./src/config/db.js"

async function startdb() {
    try {
        await databaseConnection()
    } catch (error) {
        console.log(error)
    }
}
startdb()


const port = process.env.PORT || 5050

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`)
})
