import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function databaseConnection() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected Successfully!");
    } catch (error) {
        throw error;
    }
}