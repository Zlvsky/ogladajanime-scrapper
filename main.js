const puppeteer = require("puppeteer");
const path = require("path");
const prompt = require("prompt-sync")();

const Downloader = require("./Downloader");

const ogladajAnimePage = prompt("Paste ogladajanime anime page: ");


const filepath = path.resolve(__dirname, "videos");

// PROVIDE YOUR OGLADAJANIME.PL LOGIN DATA
const loginVal = ""
const passwordVal = ""

puppeteer
  .launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=site-per-process",
      "--disable-site-isolation-trials",
      "--user-data-dir=''",
      "--enable-popup-blocking",
    ],
  })
  .then(async (browser) => {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });

    const login = async (animeLink) => {
      await page.goto(animeLink, { waitUntill: "domcontentloaded" });
      await checkIfModalPopup();
      const loginPopupButton = await page.$("nav .btn.btn-secondary");
      loginPopupButton.click();
      await page.waitForTimeout(2000);
      // Wpisywanie passow
      await page.type(".modal-dialog input[name='loginName'", loginVal, {
        delay: 50,
      });
      await page.type(".modal-dialog input[name='loginPass'", passwordVal, {
        delay: 50,
      });
      const loginButton = await page.$(
        ".modal-footer .btn-primary.bootbox-accept"
      );
      await loginButton.click();
      await page.waitForTimeout(5000);
    };

    const checkIfModalPopup = async () => {
      await page.waitForTimeout(4000);
      const exists = await page
        .$eval(".bootbox", () => true)
        .catch(() => false);
      // check if popup exist in DOM
      // if exist close it
      if (exists) {
        const modalPopup = await page.evaluate(
          () =>
            window.getComputedStyle(document.querySelector(".bootbox")).display
        );
        if (modalPopup === "block") {
          const popup1Exist = await page
            .$eval(".btn-danger.bootbox-cancel", () => true)
            .catch(() => false);
          if (popup1Exist) {
            const popupButton = await page.$(".btn-danger.bootbox-cancel");
            popupButton.click();
          }
          await page.waitForTimeout(2000);
          const popup2Exist = await page
            .$eval(".btn-success.bootbox-accept", () => true)
            .catch(() => false);
          if (popup2Exist) {
            const popupButton2 = await page.$(".btn-success.bootbox-accept");
            popupButton2.click();
          }
          await page.waitForTimeout(2000);
        }
      }
    };

    const getEpisodesLinks = async (animeLink) => {
      const episodesLinks = [];
      // get how number of episodes
      await page.goto(animeLink, { waitUntill: "domcontentloaded" });

      await checkIfModalPopup();

      const numberOfEpisodes = await page.evaluate(() => {
        const list = document.getElementById("ep_list");
        return list ? list.getElementsByTagName("li").length : 0;
      });

      // loop to add single episodes links
      for (let i = 1; i <= numberOfEpisodes; i++) {
        episodesLinks.push(animeLink + `/${i}`);
      }
      return episodesLinks;
    };

    const loadHighestQuality = async () => {
      await page.evaluate(() =>
        document
          .querySelector("iframe")
          .contentWindow.document.querySelector(".pb-settings-click")
          .click()
      );

      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const iframe = document.querySelector("iframe");
        const iframeDocument = iframe.contentWindow.document;
        const settingsQualityElements =
          iframeDocument.querySelectorAll(".settings-quality");
        const lastSettingsQualityElement =
          settingsQualityElements[settingsQualityElements.length - 1];
        lastSettingsQualityElement.click();
      });
    };

    const loadCDAiFrame = async () => {
      const loadPlayer = await page.$("#playerStartImg img");
      loadPlayer.click();
      console.log("clicked");
      await page.waitForTimeout(2000);
      const changePlayer = await page.$("#changePlayerButton");
      changePlayer.click();
      const isDropDownVisible = await page.evaluate(() => {
        const element = document.querySelector("#changePlayerData");
        return element.classList.contains("show");
      });
      if (!isDropDownVisible) {
        changePlayer.click();
      }
      await page.waitForTimeout(1000);
      // click cda button
      // const elements = await page.$$("#changePlayerData a");
      // const link = elements.forEach((el) => {
      //   if(el.innerText.includes("cda")) return el;
      // });
      // link.click()

      await page.evaluate(() => {
        [...document.querySelectorAll("#changePlayerData a")]
          .find((el) => el.innerText.includes("cda"))
          .click();
      });

      await page.waitForTimeout(1000);
      await loadHighestQuality();
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
      await login(animeLink);
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
