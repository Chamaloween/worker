import chalk from "chalk";
import { userdata } from "../data/userdata";

const winston = require("winston");
const fs = require("fs");
const inputReader = require("wait-console-input");
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

export async function Login() {
    await puppeteer.launch({ headless: false , executablePath: userdata.settings.Chromeexe, userDataDir: userdata.settings.UserDataPath, args: ['--no-sandbox']}).then(async (browser: any) => {
        //Open Login Page
        const loginpage = await browser.newPage()
        await loginpage.setDefaultTimeout(0)
        //Set Cookies if found for Autologin
        if (userdata.settings.UserDataPath === "" && fs.existsSync('./twitch-session.json')) {
            let file = fs.readFileSync('./twitch-session.json', 'utf8');
            let cokkies = await JSON.parse(file)
            await loginpage.setCookie.apply(loginpage, cokkies);
        }
        //Goto Login Page
        winston.info(" ");
        winston.info(chalk.gray("Starting Login Page..."))
        await loginpage.goto(userdata.loginpageurl, {waitUntil: "networkidle2"})
        //Wait for User to Login
        winston.info(" ");
        winston.info(chalk.gray("Please Login with you Account..."))
        if (userdata.settings.debug && userdata.settings.displayless) {
            await loginpage.screenshot({path: 'screenshot.png'})
            winston.info("DEBUG: Status Screen of Loginpage")
        }
        try {
            await loginpage.waitForNavigation().then((r: any )=> {
                if (r._url !== 'https://www.twitch.tv/?no-reload=true') {
                    winston.info(chalk.red("Closing... Failed to Login..."))
                    if (!userdata.settings.displayless) inputReader.wait(chalk.gray("Press any Key to continue..."))
                    process.exit(22);
                }
            })
        } catch (error) {
            winston.info(chalk.red("Closing... Failed to Login..."))
            if (!userdata.settings.displayless) inputReader.wait(chalk.gray("Press any Key to continue..."))
            process.exit(22);
        }
        winston.info(" ");
        winston.info(chalk.green("Success Login..."))
        //Save Cookies
        winston.info(" ");
        winston.info(chalk.gray("Saving Cookies..."))
        userdata.cookies = await loginpage.cookies();

        await fs.promises.writeFile('twitch-session.json', JSON.stringify(userdata.cookies, null, 2)).then(function () {
            winston.info(" ");
            winston.info(chalk.green("Successfully Saved Cookies..."))
            winston.info(" ");
        }).catch((err: any) => {throw err})
        //Close Browser
        winston.info(" ");
        winston.info(chalk.gray("Closing Browser and Moving on..."))
        await browser.close()
    })
}


