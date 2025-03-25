const puppeteer = require('puppeteer');
const express = require('express');

const app = express();

// Root route
app.get('/', (req, res) => {
    res.send('Hello, Node.js!');
});

// Scraping route
app.get('/scrape', async (req, res) => {
    try {

        const { cid } = req.query;  
        console.log("id",cid)

        if (!cid) {
            return res.status(400).json({ error: "CID parameter is required" });
        }
        // const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: await puppeteer.executablePath(),
        });
        


        const page = await browser.newPage();
        
        await page.goto(cid , { waitUntil: 'networkidle2' });

        // Wait for the button to appear
        await page.waitForSelector("button.DkEaL", { timeout: 10000 });

        // Extract category
        const category = await page.evaluate(() => {
            let categoryElement = document.querySelector("button.DkEaL");
            return categoryElement ? categoryElement.innerText : "Category not found!";
        });

        await browser.close();

        res.json({ categories: [category] });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Scraping failed" });
    }
});

// Start Express server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
