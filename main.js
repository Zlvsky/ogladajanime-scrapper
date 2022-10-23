const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const ogladajAnimePage = "https://ogladajanime.pl/anime/death-parade";

puppeteer
  .launch({
    headless: false,
    executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
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
      // Array.from(playerTable)
      //   .find((el) => el.innerText === "cda")
      //   .parentElement.querySelector("button")
      //   .click();
    };

    const getVideoLink = async () => {
      await page.waitForTimeout(2000);
      const videoSource = await page.evaluate(
        () =>
          // document.querySelector(".pb-fl-player-wrap > video").src
          document
            .querySelector("iframe")
            .contentWindow.document.querySelector("video").src
      );
      console.log(videoSource)
    //   const videoSource = await page.evaluate(() =>
    //     document.querySelector(".pb-fl-player-wrap video").src
    //   );

    //   const videoElement = await page.$(".pb-fl-player-wrap > video");
    //   const videoSource = videoElement.src;
    };

    const getVideoLinks = async (animeLink) => {
      const episodesLinks = await getEpisodesLinks(animeLink);
      console.log(episodesLinks);
      for (let i = 0; i < episodesLinks.length; i++) {
        await page.goto(episodesLinks[i], { waitUntill: "domcontentloaded" });
        await loadCDAiFrame();
        await page.waitForTimeout(4000);
        await getVideoLink();
      }
      // episodesLinks.forEach(async (el) => {
      //     console.log(el)
      //   await app.page.goto(el, { waitUntill: "domcontentloaded" });
      //   await app.loadCDAiFrame();
      //   await app.getVideoLink();
      // });
    };

    await getVideoLinks(ogladajAnimePage);
  });
