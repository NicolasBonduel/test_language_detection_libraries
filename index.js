const cld = require("cld");
const franc = require("franc");
const { Language } = require("node-nlp");
const languageDataSet = require("./dataset.js");
const iso3to1 = require("iso-639-3-to-1");
const fs = require("fs");

const language = new Language();
const resultsNLPJS = languageDataSet.map(({ labels, text }) => {
  const guess = language.guess(text);
  return {
    text,
    language: labels,
    code: guess[0].alpha2,
    second_code: guess[1]?.alpha2,
    second_score: guess[1]?.score,
    success: guess[0].alpha2 === labels,
  };
});

const resultsFranc = languageDataSet.map(({ labels, text }) => {
  const all = franc.all(text);
  return {
    text,
    language: labels,
    code: iso3to1(all[0][0]) || all[0][0],
    second_code: all[1]?.[0] ? iso3to1(all[1][0]) ?? all[1][0] : undefined,
    second_score: all[1]?.[1] ?? all[1]?.[1],
    success: iso3to1(all[0][0]) === labels,
  };
});

const resultsCLP = [];
const promises = languageDataSet.map(({ labels, text }) => {
  return cld
    .detect(text, {
      // languageHint: "fr",
      isHTML: false,
    })
    .then((result) => {
      resultsCLP.push({
        text,
        language: labels,
        code: result.languages[0].code,
        score: result.languages[0].score,
        success: result.languages[0].code === labels,
      });
    })
    .catch((err) => {
      resultsCLP.push({
        text,
        language: labels,
        success: null,
      });
    });
});

(async () => {
  await Promise.all(promises);
  fs.writeFile("results.clp", JSON.stringify(resultsCLP), () => {});
  fs.writeFile("results.franc", JSON.stringify(resultsFranc), () => {});
  fs.writeFile("results.nlpjs", JSON.stringify(resultsNLPJS), () => {});
})();
