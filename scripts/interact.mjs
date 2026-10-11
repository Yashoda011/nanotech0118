import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:5173";

mkdirSync("scripts/shots", { recursive: true });
writeFileSync(
  "scripts/test-data.csv",
  "cycle,value_a,value_b\n1,12,40\n2,18,42\n3,25,45\n4,22,47\n5,30,52\n6,28,55\n",
);

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu-sandbox", "--use-gl=swiftshader"],
});

const errors = [];
const results = [];
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${page.url()} :: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${page.url()} :: ${err.message}`));
const check = (name, ok, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.setViewport({ width: 1440, height: 960 });

// 0a. Root redirects to login when signed out
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(1000);
check("Root redirects to /login when signed out", page.url().includes("/login"), page.url());
await page.screenshot({ path: "scripts/shots/login.png" });

// 0b. Continue as guest
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Continue as guest"));
  btn?.click();
});
await sleep(1200);
check("Continue as guest enters dashboard", page.url().replace(BASE, "") === "/", page.url());
const guestShown = await page.evaluate(() => document.body.innerText.includes("Guest"));
check("Guest name visible after login", guestShown);

// 0c. Logout returns to login
await page.evaluate(() => {
  const trigger = [...document.querySelectorAll("header button")].find((b) => b.textContent?.includes("Guest"));
  trigger?.click();
});
await sleep(500);
await page.evaluate(() => {
  const item = [...document.querySelectorAll("button")].find((el) => el.textContent?.trim() === "Sign out");
  item?.click();
});
await sleep(900);
check("Sign out returns to /login", page.url().includes("/login"), page.url());

// 0d. Signup creates an account
await page.goto(BASE + "/signup", { waitUntil: "networkidle0" });
await sleep(800);
await page.type('input[autocomplete="name"]', "Ada Nano");
await page.type('input[autocomplete="email"]', "ada@nanosphere.io");
await page.type('input[autocomplete="new-password"]', "secret123");
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Create account"));
  btn?.click();
});
await sleep(1200);
check("Signup enters dashboard as new user", page.url().replace(BASE, "") === "/", page.url());
const adaShown = await page.evaluate(() => document.body.innerText.includes("Ada Nano"));
check("New account name visible in UI", adaShown);

// 0e. Logout then login with the created account
await page.evaluate(() => {
  const trigger = [...document.querySelectorAll("header button")].find((b) => b.textContent?.includes("Ada Nano"));
  trigger?.click();
});
await sleep(500);
await page.evaluate(() => {
  const item = [...document.querySelectorAll("button")].find((el) => el.textContent?.trim() === "Sign out");
  item?.click();
});
await sleep(900);
await page.type('input[autocomplete="email"]', "ada@nanosphere.io");
await page.type('input[autocomplete="current-password"]', "secret123");
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Sign in"));
  btn?.click();
});
await sleep(1200);
check("Login with created account works", page.url().replace(BASE, "") === "/", page.url());

// 1. Dashboard full page
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(1600);
await page.screenshot({ path: "scripts/shots/dashboard-full.png", fullPage: true });

// 2. Start Exploring → /explore
await page.click('button:has-text("Start Exploring")').catch(async () => {
  const btns = await page.$$("button");
  for (const b of btns) {
    const t = await b.evaluate((el) => el.textContent);
    if (t?.includes("Start Exploring")) return b.click();
  }
});
await sleep(900);
check("Start Exploring navigates to /explore", page.url().endsWith("/explore"), page.url());

// 3. Explore filter by typing
await page.type('input[aria-label="Search the material catalogue"]', "graph");
await sleep(700);
const found = await page.evaluate(() => document.body.innerText.includes("materials found") || document.body.innerText.includes("material found"));
check("Explore search filters results", found);

// 4. Topbar search suggestion
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(800);
await page.type('input[aria-label="Search nanomaterials, properties, or keywords"]', "silic");
await sleep(600);
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Enter");
await sleep(1000);
check("Topbar search navigates to material", page.url().includes("/materials/silicon-nanowires"), page.url());

// 5. Simulation run
await page.goto(BASE + "/simulation?material=graphene&model=electron", { waitUntil: "networkidle0" });
await sleep(1200);
const runBtn = await page.$$("button");
let clicked = false;
for (const b of runBtn) {
  const t = await b.evaluate((el) => el.textContent ?? "");
  if (t.includes("Run simulation")) {
    await b.click();
    clicked = true;
    break;
  }
}
check("Run simulation button clicked", clicked);
await sleep(4200);
const completed = await page.evaluate(() => document.body.innerText.includes("Run history") && document.body.innerText.includes("peak"));
check("Simulation completed and logged", completed);
await page.screenshot({ path: "scripts/shots/simulation-done.png", fullPage: true });

// 6. Create project
await page.goto(BASE + "/projects", { waitUntil: "networkidle0" });
await sleep(800);
const before = await page.evaluate(() => document.querySelectorAll("h2").length);
for (const b of await page.$$("button")) {
  const t = await b.evaluate((el) => el.textContent ?? "");
  if (t.includes("New project")) {
    await b.click();
    break;
  }
}
await sleep(500);
await page.type('input[placeholder="e.g. Quantum Dot LED stack"]', "NanoSphere QA Run");
for (const b of await page.$$("button")) {
  const t = await b.evaluate((el) => el.textContent ?? "");
  if (t.trim() === "Create project") {
    await b.click();
    break;
  }
}
await sleep(800);
const hasNew = await page.evaluate(() => document.body.innerText.includes("NanoSphere QA Run"));
check("Project created and visible", hasNew);

// 7. Dataset upload via hidden input
await page.goto(BASE + "/analysis", { waitUntil: "networkidle0" });
await sleep(800);
const inputs = await page.$$('input[type="file"]');
check("File input present on analysis", inputs.length > 0);
if (inputs.length) {
  await inputs[0].uploadFile("scripts/test-data.csv");
  await sleep(1200);
  const uploaded = await page.evaluate(() => document.body.innerText.includes("test-data.csv"));
  check("CSV upload parsed into dataset", uploaded);
  await page.screenshot({ path: "scripts/shots/analysis-uploaded.png", fullPage: true });
}

// 8. Notifications dropdown
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(800);
for (const b of await page.$$("header button")) {
  const label = await b.evaluate((el) => el.getAttribute("aria-label") ?? "");
  if (label.startsWith("Notifications")) {
    await b.click();
    break;
  }
}
await sleep(500);
const notifOpen = await page.evaluate(() => document.body.innerText.includes("Mark all read"));
check("Notifications dropdown opens", notifOpen);

// 9. Mobile drawer
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(1000);
await page.screenshot({ path: "scripts/shots/mobile-dashboard.png", fullPage: true });
for (const b of await page.$$("button")) {
  const label = await b.evaluate((el) => el.getAttribute("aria-label") ?? "");
  if (label === "Open navigation") {
    await b.click();
    break;
  }
}
await sleep(600);
const drawer = await page.evaluate(() => document.body.innerText.includes("Upgrade to Pro"));
check("Mobile drawer opens", drawer);
await page.screenshot({ path: "scripts/shots/mobile-drawer.png" });

// 10. Tablet dashboard
await page.setViewport({ width: 1024, height: 900 });
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await sleep(1200);
await page.screenshot({ path: "scripts/shots/tablet-dashboard.png", fullPage: true });

console.log("\n=== CHECKS ===");
results.forEach((r) => console.log(r));
console.log("\n=== ERRORS ===");
if (!errors.length) console.log("none");
else errors.forEach((e) => console.log(e));

rmSync("scripts/test-data.csv", { force: true });
await browser.close();
