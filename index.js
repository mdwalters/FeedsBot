import Bot from "meowerbot";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import { extract } from "@extractus/feed-extractor";

dotenv.config();

const username = process.env["FB_USERNAME"], password = process.env["FB_PASSWORD"];
const help = [`@${username} help`, `@${username} subscribe`];
const db = new JSONdb("db.json");
const bot = new Bot(username, password);

if (!(db.has("feeds"))) {
    db.set("feeds", []);
}

async function update() {
    try {
        let feeds = db.get("feeds");
        for (let i in feeds) {
            let extracted = feeds[i];
            let extractedFeed = await extract(extracted.url);
            
            if (new Date(feeds[i].latest.published).getTime() < new Date().getTime()) {
                bot.post(`@${feeds[i].user} A new entry in "${feeds[i].title}" has been published!
    ${feeds[i].latest.link}`);
            }
        }
    } catch(e) {
        console.error(e);
    }
}

bot.onPost(async (user, content) => {
    if (content.startsWith(`@${username} help`)) {
        bot.post(`Commands: ${help.join(" ")}`);
    }

    if (content.startsWith(`@${username} subscribe`)) {
        try {
            let feed = await extract(content.split(" ")[2]);
            let subscriptions = db.get("feeds");
            subscriptions.push({"name": feed.title,"url": content.split(" ")[2], "latest": feed.entries[0],"user": user});
            bot.post(`Successfully subscribed to "${feed.title}"!`)
        db.set(subscriptions);
        } catch(e) {
            console.error(e);
            bot.post("There was a error fetching the feed!");
            return;
        }
    }
});

bot.onClose(() => {
    console.error("Disconnected");
});

bot.onLogin(() => {
    bot.post(`${username} is now online! Use @${username} help to see a list of commands.`);
});

setInterval(() => {
    update();
}, 60000);