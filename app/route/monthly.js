
const helpers = require("../helpers/index.js");
const { instanceMethods } = require("p-iteration");

Object.assign(Array.prototype, instanceMethods);

const getMealDataAsObject = async (ctx, id) => {
    const dom = await ctx.JSDOM.fromURL("http://sshs.hs.kr/75054/subMenu.do/dggb/module/mlsv/selectMlsvDetailPopup.do?mlsvId=" + id);
    const data = dom.serialize();

    let dataFromHTMLAsArray = helpers.getRegexCaptureAsArray({
        str: data,
        regexp: /<td class="ta_l">\s*([^\s]+[^<>]*[^\s]+)\s*<\/td>/g
    }).reduce((acc, val) => acc.concat(val), []);

    return {
        type: dataFromHTMLAsArray[2],
        menu: dataFromHTMLAsArray[3].replace(/&amp;/g, "&").split(","),
        calories: dataFromHTMLAsArray[4]
    };
};



module.exports = async ctx => {
    const dom = await ctx.JSDOM.fromURL("http://sshs.hs.kr/75054/subMenu.do");
    const data = dom.window.document.querySelector("tbody").outerHTML;

    ctx.message = (await helpers.getRegexCaptureAsArray({
        str: data,
        regexp: /<td.*?>\s*(\d+)\s*<ul>\s*([^]*?)\s*<\/ul><\/td>/g
    }).asyncMap(async (element, index, array) => ({
        date: parseInt(element[0]),
        menu: await helpers.getRegexCaptureAsArray({
            str: element[1],
            regexp: /<li>\s*<a href="javascript:void\(0\);" onclick="fnDetail\('(\d+)'\);"><span class="ico_schFood"><\/span>(.+?)<\/a>\s*<\/li>\s*/g
        }).asyncMap(async (element, index, array) => await getMealDataAsObject(ctx, parseInt(element[0]))) 
    }))).filter(element => element.menu.length != 0);
};
