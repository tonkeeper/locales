const fs = require("fs");
const path = require("path");

const message = (value) => console.log(`----------${value}----------`);

const src = "./src/";
const dist = "./dist";

const defaultLocale = "en";

const readLocales = (dict) => {
  const locales = fs.readdirSync(src);
  const files = fs.readdirSync(path.join(src, defaultLocale));

  for (let locale of locales) {
    dict[locale] = {};
    for (let file of files) {
      const item = path.join(src, locale, file);
      if (fs.existsSync(item)) {
        const data = JSON.parse(fs.readFileSync(item).toString("utf8"));

        dict[locale] = {
          ...dict[locale],
          ...flattenObject(data),
        };
      }
    }
  }
};
const writeLocales = (dict) => {
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
  }

  Object.entries(dict).forEach(([key, values]) => {
    console.log(key);
    fs.writeFileSync(
      path.join(dist, `${key}.json`),
      JSON.stringify(values, null, 2)
    );
  });
};

const fillMissingLocales = (dict) => {
  const defaults = dict[defaultLocale];
  Object.entries(dict).forEach(([key, values]) => {
    if (key === defaultLocale) return;
    Object.keys(defaults).forEach((defaultKey) => {
      if (values[defaultKey] == undefined) {
        values[defaultKey] = defaults[defaultKey];
      }
    });
  });
};

const updateReadme = (missing, total) => {
  const lines = ["# TonApps Locales", "Locales storage for TonApps projects"];

  Object.entries(missing).forEach(([locale, keys]) => {
    if (keys.length) {
      lines.push("");
      const icon = keys.length > 100 ? "🟥" : "🟦";

      lines.push(`## Missing transactions for ${locale} locale ${icon}`);
      lines.push(`Missing ${keys.length} phrases of ${total} total`);

      lines.push("");
      lines.push("<details>");
      lines.push("  <summary>Show</summary>");
      lines.push("");
      keys.forEach((value) => lines.push(`- ${value}`));
      lines.push("");
      lines.push("</details>");
    }
  });

  fs.writeFileSync("README.md", lines.join("\n"), { encoding: "utf8" });
};

const logMissingKeys = (dict) => {
  const missing = {};

  const defaults = dict[defaultLocale];

  const total = Object.keys(defaults).length;

  Object.entries(dict).forEach(([locale, values]) => {
    if (locale === defaultLocale) return;
    missing[locale] = [];
    Object.keys(defaults).forEach((defaultKey) => {
      if (values[defaultKey] == undefined) {
        missing[locale].push(defaultKey);
      }
    });
  });

  Object.entries(missing).forEach(([locale, keys]) => {
    if (keys.length) {
      console.log(
        `Missing transactions for ${locale}, Missing ${keys.length} phrases of ${total} total`
      );
    }
  });

  updateReadme(missing, total);
};

const flattenObject = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + "." : "";
    if (typeof obj[k] === "object")
      Object.assign(acc, flattenObject(obj[k], pre + k));
    else acc[pre + k] = obj[k];
    return acc;
  }, {});

const bumpMinorVersion = () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  const versions = packageJson.version.split(".");
  versions[versions.length - 1] = parseInt(versions[versions.length - 1]) + 1;
  packageJson.version = versions.join(".");

  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
};

const main = () => {
  message("Build Locales");

  const dict = {};

  readLocales(dict);

  logMissingKeys(dict);

  fillMissingLocales(dict);

  writeLocales(dict);

  bumpMinorVersion();

  message("End Build Locales");
};

main();
