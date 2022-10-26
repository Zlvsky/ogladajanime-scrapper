const puppeteer = require("puppeteer");
const path = require("path");
const prompt = require("prompt-sync")();

const Downloader = require("./Downloader");

const ogladajAnimePage = prompt("Paste ogladajanime anime page: ");


const filepath = path.resolve(__dirname, "videos");

puppeteer
  .launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=site-per-process",
      "--disable-site-isolation-trials",
      "--user-data-dir=''",
    ],
  })
  .then(async (browser) => {
    const page = await browser.newPage();

    const checkIfModalPopup = async () => {
      await page.waitForTimeout(4000);
      const exists = await page.$eval(".bootbox", () => true).catch(() => false);
      // check if popup exist in DOM
      // if exist close it
      if(exists) {
        const modalPopup = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector(".bootbox")).display
        );
        if (modalPopup === "block") {
          const popupButton = await page.$(".btn-warning.bootbox-cancel");
          popupButton.click();
          await page.waitForTimeout(2000);
          const popupButton2 = await page.$(".btn-success.bootbox-accept");
          popupButton2.click();
          await page.waitForTimeout(2000);
        }
      }
    };

    const getEpisodesLinks = async (animeLink) => {
      const episodesLinks = [];
      // Load page with list of episodes
      const animeLinkEpisodes = animeLink + "/episodes";
      await page.goto(animeLinkEpisodes, { waitUntill: "domcontentloaded" });
      // wait for popup and close it
      await checkIfModalPopup();
      // get how number of episodes
      const lastEpisode = await page.evaluate(
        () =>
          document.querySelector(
            "#episode_table > tbody > tr:last-child > td:first-child"
          ).innerText
      );

      // loop to add single episodes links
      for (let i = 1; i <= Number(lastEpisode); i++) {
        episodesLinks.push(animeLink + `/${i}`);
      }
      return episodesLinks;
    };

    const loadCDAiFrame = async () => {
      const playerTable = await page.$$("table > tbody > tr td");
      await page.waitForTimeout(1000);
      // click cda button
      await page.evaluate(() => {
        [...document.querySelectorAll("table > tbody > tr td")]
          .find((el) => el.innerText === "cda")
          .parentElement.querySelector("button")
          .click();
      });
    };

    const downloadVideo = async (index) => {
      await page.waitForTimeout(2000);
      const videoSource = await page.evaluate(
        () =>
          document
            .querySelector("iframe")
            .contentWindow.document.querySelector("video").src
      );
      Downloader.download(videoSource, filepath, `${index}.mp4`, () => {
        console.log("Download complete for " + filename);
      });
      console.log(videoSource);
    };

    const getVideoLinks = async (animeLink) => {
      const episodesLinks = await getEpisodesLinks(animeLink);
      console.log(episodesLinks);
      for (let i = 0; i < episodesLinks.length; i++) {
        await page.goto(episodesLinks[i], { waitUntill: "domcontentloaded" });
        await loadCDAiFrame();
        await page.waitForTimeout(4000);
        await downloadVideo(i);
      }
    };

    await getVideoLinks(ogladajAnimePage);
  });
