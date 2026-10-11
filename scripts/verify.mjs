import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:5173";
const ROUTES = [
  ["dashboard", "/"],
  ["explore", "/explore"],
  ["material", "/materials/graphene"],
  ["simulation", "/simulation?material=graphene&model=electron"],
  ["lab-tools", "/lab-tools"],
  ["analysis", "/analysis"],
  ["projects", "/projects"],
  ["resources", "/resources"],
  ["research", "/research"],
  ["article", "/research/nano-renewable-energy"],
  ["settings", "/settings"],
  ["notfound", "/nope"],
];

mkdirSync("scripts/shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu-sandbox", "--use-gl=swiftshader"],
});

const errors = [];
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${page.url()} :: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${page.url()} :: ${err.message}`));

await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

// Auth screens (logged out)
await page.goto(BASE + "/signup", { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "scripts/shots/signup.png", fullPage: false });
console.log("shot: signup");

await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "scripts/shots/login.png", fullPage: false });
console.log("shot: login");

// Sign in as guest so protected routes render
for (const b of await page.$$("button")) {
  const t = await b.evaluate((el) => el.textContent ?? "");
  if (t.includes("Continue as guest")) {
    await b.click();
    break;
  }
}
await new Promise((r) => setTimeout(r, 1500));

for (const [name, path] of ROUTES) {
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: `scripts/shots/${name}.png`, fullPage: false });
  console.log(`shot: ${name}`);
}

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "scripts/shots/mobile-dashboard.png" });
await page.goto(BASE + "/explore", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: "scripts/shots/mobile-explore.png" });

await page.setViewport({ width: 1024, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: "scripts/shots/tablet-dashboard.png" });

console.log("\n=== ERRORS ===");
if (errors.length === 0) console.log("none");
else errors.forEach((e) => console.log(e));

await browser.close();
