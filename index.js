const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Hello, Node.js!");
});

app.get("/scrape", async (req, res) => {
    try {
        const { cid } = req.query;
        if (!cid) {
            return res.status(400).json({ error: "CID parameter is required" });
        }

        console.log("Starting browser...");

        // Fetch Chromium executable path
        const executablePath = await chromium.executablePath;
        console.log("Chromium executable path:", executablePath);

        if (!executablePath) {
            throw new Error("Chromium executable path is undefined.");
        }

        const browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process",
            ],
            executablePath, // Ensures it is correctly resolved
            headless: chromium.headless,
        });

        console.log("Browser launched successfully!");

        const page = await browser.newPage();
        await page.goto(cid, { waitUntil: "networkidle2" });

        console.log("Page loaded:", cid);

        await page.waitForSelector("button.DkEaL", { timeout: 10000 });

        const category = await page.evaluate(() => {
            let categoryElement = document.querySelector("button.DkEaL");
            return categoryElement ? categoryElement.innerText : "Category not found!";
        });

        console.log("Extracted category:", category);

        await browser.close();

        res.json({ categories: [category] });

    } catch (error) {
        console.error("Scraping failed:", error);
        res.status(500).json({ error: "Scraping failed" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
