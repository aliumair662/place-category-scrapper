const express = require("express");
const cors = require("cors");

const isLocal = !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL_ENV;
const puppeteer = isLocal ? require("puppeteer") : require("puppeteer-core");
const chromium = isLocal ? null : require("@sparticuz/chromium");

const app = express();
// Enable CORS for all requests
app.use(cors()); 

app.get("/", (req, res) => {
    res.send("Hello, Node.js!");
});

app.get("/api/scrape", async (req, res) => {  // <-- Change to `/api/scrape`
    try {
        const { cid } = req.query;
        if (!cid) {
            return res.status(400).json({ error: "CID parameter is required" });
        }

        console.log("Starting browser...");

        let browser;
        if (isLocal) {
            browser = await puppeteer.launch({
                //headless: "new",
                headless: true,
                
                args: ["--no-sandbox", "--disable-gpu"],
            });
        } else {
            const executablePath = await chromium.executablePath();
            console.log("Chromium executable path:", executablePath);

            if (!executablePath) throw new Error("Chromium executable path is undefined.");

            browser = await puppeteer.launch({
                args: [...chromium.args, "--no-sandbox", "--disable-gpu"],
                executablePath,
                headless: chromium.headless || "new",
            });
        }

        console.log("Browser launched successfully!");

        const page = await browser.newPage();
        //await page.goto(`https://maps.google.com/?cid=${cid}`, { waitUntil: "networkidle2" });
        await page.goto(`https://maps.google.com/?cid=${cid}`, { waitUntil: "domcontentloaded" });

        console.log("Page loaded:", cid);

        await page.waitForSelector("button.DkEaL", { timeout: 10000 });

        const category = await page.evaluate(() => {
            let categoryElement = document.querySelector("button.DkEaL");
            return categoryElement ? categoryElement.innerText : "Category not found!";
        });

        console.log("Extracted category:", category);

        await browser.close();

        res.json({ categories: category });

    } catch (error) {
        console.error("Scraping failed:", error);
        res.status(500).json({ error: "Scraping failed" });
    }
});

// Remove local server initialization, as Vercel handles it automatically
module.exports = app; 
