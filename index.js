const request = require('http');
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const moment = require('moment');
const question = require('./src/testResult/Questionair');
const searchFilter = require('./src/searchResult/SearchFilter');
const crypto = require('crypto');
const _ = require('lodash');

require('dotenv').config();

const app = express();

const config = {
    channelAccessToken: "DUPTQDbc7OJ4TWhAoH0g3CQrFzUrM3V5/Rct8+/WrYzFlRa+52O4WJhKZfLcf5UfTFVbvlUFGoYwvi9DuZX+Y7lEZxg6ooJizTKfZ24q7RaDT3SOqmiGNSdXcPAsupgW4clP2b6qTzofsGDlRH7/hAdB04t89/1O/w1cDnyilFU=",
    channelSecret: "27374a9d6aadc76cee07b49aa8955ec3"
};

const client = new line.Client(config);

const getTitle = (score) => {
    if (score >= 36) {
        return ("เสี่ยงสูง ")
    } else if (score >= 30) {
        return ("เสี่ยงปานกลางถึงสูง")
    } else if (score >= 23) {
        return ("เสี่ยงปานกลาง")
    } else if (score >= 17) {
        return ("เสี่ยงต่ำถึงปานกลาง ")
    } else if (score <= 16) {
        return ("เสี่ยงต่ำ")
    } else {
        return ("ผลการทดสอบไม่สมบูรณ์")
    }
}

const getDescPhoto = (score) => {
    let imageSuittest = { original: undefined, preview: undefined }
    if (score >= 36) {
        imageSuittest.original = "https://www.treasurist.com/assets/images/line_risk5.png"
        imageSuittest.preview = "https://www.treasurist.com/assets/images/line_risk5.png"
    } else if (score >= 30) {
        imageSuittest.original = "https://www.treasurist.com/assets/images/line_risk4.png"
        imageSuittest.preview = "https://www.treasurist.com/assets/images/line_risk4.png"
    } else if (score >= 23) {
        imageSuittest.original = "https://www.treasurist.com/assets/images/line_risk3.png"
        imageSuittest.preview = "https://www.treasurist.com/assets/images/line_risk3.png"
    } else if (score >= 17) {
        imageSuittest.original = "https://www.treasurist.com/assets/images/line_risk2.png"
        imageSuittest.preview = "https://www.treasurist.com/assets/images/line_risk2.png"
    } else if (score <= 16) {
        imageSuittest.original = "https://www.treasurist.com/assets/images/line_risk1.png"
        imageSuittest.preview = "https://www.treasurist.com/assets/images/line_risk1.png"
    }
    return imageSuittest
}

let testResult = [];
let searchResult = [];
let titleMaxChar = 40;
let textMaxChar = 60;
let textRegex = /(\bหากองทุน\b)/;
let fundRecommendList;


app.post('/webhook', line.middleware(config), (req, res) => {
    if (!validate_signature(req.headers['x-line-signature'], req.body)) {
        return;
    } else {
        Promise.all(req.body.events.map(handleEvent))
            .then((result) => res.json(result));
    }
});

function validate_signature(signature, body) {
    return signature == crypto.createHmac('sha256', config.channelSecret).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
}

function handleEvent(event) {

    if (event.type === 'message' && event.message.type === 'text' && event.message.text.toLowerCase() === "เริ่มใหม่") {
        testResult = _.remove(testResult, tr => { return tr.userId !== event.source.userId; });
        searchResult = _.remove(searchResult, sr => { return sr.userId !== event.source.userId; });
        let msg = {
            "type": "text",
            "text": `กลับมาที่จุดเริ่มต้นแล้ว คุณสามารถทำแบบทดสอบอีกครั้งด้วยการพิมพ์ 'Quiz' หรือค้นหากองทุนแนะนำด้วยการพิมพ์ 'กองทุนแนะนำ'`
        };
        return client.replyMessage(event.replyToken, msg);
    }


    if (event.type === 'message' && event.message.type === 'text') {
        var isTesting = _.find(testResult, ['userId', event.source.userId]);
        var isSearch = _.find(searchResult, ['userId', event.source.userId]);

        if (isTesting) {
            testResult.filter(tr => tr.userId === event.source.userId)
                .map(tr => {
                    return handlePostBackEvent(event, tr);
                })
        } else if (isSearch) {
            searchResult.filter(sr => sr.userId === event.source.userId)
                .map(sr => {

                    if (sr.currentStep != undefined) {
                        return handleSearchEvent(event, sr);
                    } else {
                        sr.currentStep = 0
                        let newResult = getSearchObj(undefined, event.message.text.toLowerCase())
                        sr.text = newResult != undefined ? `${sr.text}&${newResult}` : undefined
                        let msg = searchFilterOption(searchFilter[sr.currentStep], sr.currentStep)
                        return client.replyMessage(event.replyToken, msg);
                    }
                })
        } else {
            handleMessageEvent(event);
        }
    } else if (event.type === 'postback') {
        if (event.postback.data.split("&")[0].split("=")[1] === "search") {
            searchResult && searchResult.filter(sr => sr.userId === event.source.userId).map(sr => { return handleSearchEvent(event, sr); })
        } else {
            testResult && testResult.filter(tr => tr.userId === event.source.userId).map(tr => { return handlePostBackEvent(event, tr); })
        }

    } else {
        return Promise.resolve(null);
    }
}

function handleMessageEvent(event) {
    var eventText = event.message.text.toLowerCase()
    var eventType = event.source.type
    if (eventText === "menu") {
        let msg = {
            "type": "template",
            "altText": "ยินดีต้อนรับสู่ Treasuirst.com",
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                "title": "ยินดีต้อนรับสู่ Treasuirst.com",
                "text": "กรุณาเลือกหัวข้อเพื่อเริ่มใช้งาน",
                "actions": [
                    {
                        "type": "postback",
                        "label": "ทำ Quiz เพื่อรับแผนลงทุน",
                        "data": "quiz",
                        "text": "quiz"
                    },
                    {
                        "type": "postback",
                        "label": "ค้นหากองทุนแนะนำ",
                        "data": "กองทุนแนะนำ",
                        "text": "กองทุนแนะนำ"
                    },
                    {
                        "type": "uri",
                        "label": "ศึกษาข้อมูลเพิ่มเติม",
                        "uri": "https://www.treasurist.com/howItWork"
                    }
                ]

            }
        }
        return client.replyMessage(event.replyToken, msg);
    } else if (eventText === "quiz" && eventType === "user") {
        let msg = {
            "type": "template",
            "altText": "Welcome to Treasurist",
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                "title": "Welcome to Treasurist Test",
                "text": "เริ่มวางแผนการลงทุนที่เหมาะกับคุณ",
                "actions": [
                    {
                        "type": "postback",
                        "label": "Start",
                        "data": "action=quiz"
                    }
                ]
            }
        }
        testResult = _.concat(testResult, [{ "userId": event.source.userId, "data": {}, "currentQuestion": undefined }])
        return client.replyMessage(event.replyToken, msg);
    } else if (textRegex.test(eventText)) {
        var keyword = eventText.split("หากองทุน ")[1] ? eventText.split("หากองทุน ")[1] : undefined
        if (keyword) {
            textURL = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&riskLevel=1,2,3,4,5,6,7,8&taxBenefit=0,1&location=1,2&keyword=%25${keyword}%25`
            searchResult = _.concat(searchResult, [{ "userId": event.source.userId, "text": textURL, "currentStep": undefined }])
            searchResult.filter(sr => sr.userId === event.source.userId).map(sr => { doSubmitSearch(sr, event) })
        } else {
            let msg = {
                "type": "text",
                "text": "คุณอยากค้นหากองทุนแบบไหน ให้พิมพ์สิ่งที่อยากค้นหาต่อได้เลยค่ะ"
            }
            textURL = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList`
            searchResult = _.concat(searchResult, [{ "userId": event.source.userId, "text": textURL, "currentStep": undefined }])
            return client.replyMessage(event.replyToken, msg);
        }
    } else if (eventText === "กองทุนแนะนำ") {
        textURL = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&keyword=%25%25`
        searchResult = _.concat(searchResult, [{ "userId": event.source.userId, "text": textURL, "currentStep": 0 }])
        searchResult.filter(sr => sr.userId === event.source.userId)
        .map(sr => {
            let msg = searchFilterOption(searchFilter[sr.currentStep], sr.currentStep)
            return client.replyMessage(event.replyToken, msg);
        })
    } else if (eventText === "help") {
        let msg = {
            "type": "text",
            "text": `• รู้จัก Treasurist (เทรเชอริสต์) เพิ่มขึ้น พิมพ์ 'About'\n• ทำแบบทดสอบเพื่อรับแผนลงทุน พิมพ์ 'Quiz'\n• ค้นหากองทุนแนะนำประเภทต่าง ๆ พิมพ์ 'กองทุนแนะนำ'\n• ค้นหากองทุนตามใจ พิมพ์ หากองทุน ตามด้วยคำค้นหา เช่น 'หากองทุน LTF'\n• กลับไปจุดเริ่มต้น พิมพ์ 'เริ่มใหม่'\n• สอบถามเรื่องอื่น ๆ ได้ที่ m.me/treasurist`
        }
        return client.replyMessage(event.replyToken, msg);
    } else if (eventText === "about") {
        let msg = {
            "type": "text",
            "text": `เทรเชอริสต์ช่วยให้คุณเริ่มลงทุนได้ง่าย ๆ ทั้งการจัดสัดส่วนที่เหมาะสม และการเลือกกองทุนที่โดดเด่น พร้อมทั้งพาไปเปิดบัญชีและเริ่มลงทุนจริง ได้ครบทั้งหมดใน 3 นาที\n\nรู้จักบริการและจุดเด่นของเทรเชอริสต์เพิ่มเติมได้ที่ >> https://www.treasurist.com/howItWork?fix=true\nเริ่มทำแบบทดสอบเพื่อรับแผนลงทุน พิมพ์ 'Quiz'`
        }
        return client.replyMessage(event.replyToken, msg);
    }  else if (eventText === "ltf") {
        textURL = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&riskLevel=1,2,3,4,5,6,7,8&taxBenefit=0,1&location=1,2&keyword=%25${eventText}%25`
        searchResult = _.concat(searchResult, [{ "userId": event.source.userId, "text": textURL, "currentStep": undefined }])
        searchResult.filter(sr => sr.userId === event.source.userId).map(sr => { doSubmitSearch(sr, event) })
    } else {
        let msg = {
            "type": "text",
            "text": `สวัสดีค่ะ ที่พิมพ์มาก็น่าสนใจนะคะ แต่เรายังตอบไม่ได้ ถ้าอยากจะได้แผนลงทุนใน 3 นาที ให้พิมพ์ 'Quiz' หรือถ้าต้องการความช่วยเหลือให้พิมพ์ว่า 'Help' ค่ะ`
        }
        return client.replyMessage(event.replyToken, msg);
    }
}

function resultList(data) {
    let resultList = (data !== null || data !== undefined) && {
        "type": "template",
        "altText": "กองทุนแนะนำ",
        "template": {
            "type": "carousel",
            "imageSize": "contain",
            "columns": data.length > 0 ? data.map(s => {
                var fundName = s.fundNameTh.length > textMaxChar ? `${s.fundNameTh.substring(0, textMaxChar - 3)}...` : s.fundNameTh
                var fundCode = s.fundCode.length > titleMaxChar ?  s.fundCode.substring(0, titleMaxChar - 3) : s.fundCode
                var fundCodeURL = s.fundNameEn.split(/[\s/@+.()%]/).join('-').toLowerCase()
                return {
                        "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                        "title": `${fundCode}`,
                        "text": `${fundName}`,
                        "actions": [
                            {
                                "type": "uri",
                                "label": "View detail",
                                "uri": `https://www.treasurist.com/funds/${s.fundId}/${fundCodeURL}`
                            }
                        ]
                    }
            }) : {
                    "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                    "title": `ไม่พบข้อมูล!`,
                    "text": `คุณสามารถค้นหาได้อีกช่องทางเพียง`,
                    "actions": [
                        {
                            "type": "uri",
                            "label": "คลิก!",
                            "uri": "https://www.treasurist.com/"
                        }
                    ]
                }

        }
    }

    return resultList
}

function numberOnly(value) {
    if (value) {
        let numVal = parseInt((value + "").replace(/[^0-9]/g, ''))
        if (numVal > 0) {
            return false
        } else {
            return true
        }
    } else {
        return true
    }

}


function handlePostBackEvent(event, suitTest) {
    var eventPostback = event.postback != undefined ? event.postback.data.split("&") : undefined;
    var eventPostbackAction = eventPostback ? eventPostback[0] != undefined && eventPostback[0].split("=")[1] : "quiz"
    var eventPostBackItemValue = eventPostback ? eventPostback[2] != undefined ? parseInt(eventPostback[2].split("=")[1]) : undefined : event.message.text.toLowerCase()
    let isValid = false
    if (suitTest.currentQuestion === 4 || suitTest.currentQuestion === 5) {
        isValid = numberOnly(eventPostBackItemValue)
    }

    var eventPostBackItem = eventPostback ? eventPostback[1] != undefined ? parseInt(eventPostback[1].split("=")[1]) : 0 : !isValid ? suitTest.currentQuestion + 1 : suitTest.currentQuestion;

    if (eventPostbackAction === "quiz" && eventPostBackItem < 16) {

        var quizNo = eventPostBackItem + 1
        let result = eventPostBackItem != 0 && !isValid ? getAnswerObj((eventPostBackItem - 1), eventPostBackItemValue) : undefined
        suitTest.data = result != undefined ? _.merge(suitTest.data, result) : undefined
        suitTest.currentQuestion = !isValid ? eventPostBackItem : suitTest.currentQuestion
        if (question[eventPostBackItem].choices != undefined && !isValid) {
            let msg = quizResult(question[eventPostBackItem], quizNo)
            suitTest.currentQuestion = !isValid ? eventPostBackItem : suitTest.currentQuestion
            return client.replyMessage(event.replyToken, msg);
        } else {
            let msg = {
                "type": "text",
                "text": `${!isValid ? `${quizNo}. ${question[eventPostBackItem].question}` : "กรุณากรอกจำนวนเงินเป็นตัวเลข"}`
            }
            suitTest.currentQuestion = !isValid ? eventPostBackItem : suitTest.currentQuestion
            return client.replyMessage(event.replyToken, msg);
        }

    } else if (eventPostbackAction === "quiz" && eventPostBackItem === 16) {
        let resultInput = eventPostBackItem != 0 ? getAnswerObj(eventPostBackItem - 1, eventPostBackItemValue) : undefined
        suitTest.data = resultInput != undefined ? _.merge(suitTest.data, resultInput) : undefined
        doSubmitQuiz(suitTest, event)
    }
}

function quizResult(data, quizNo) {
    let quizText = `${quizNo}. ${data.question}`
    let result

    if (quizNo === 11 || quizNo === 12) {
        result = (data !== null || data !== undefined) && [
            {
                "type": "text",
                "text": `${quizText}\n\n${data.altQuestion}`
            },
            {
                "type": "template",
                "altText": "เลือก ตอบตามเลขข้อ",
                "template": {
                    "type": "buttons",
                    "text": "เลือก ตอบตามเลขข้อ",
                    "actions": data.choices.map(c => {
                        return {
                            "type": "postback",
                            "label": c.text,
                            "data": `action=quiz&itemid=${quizNo}&value=${c.value}`
                        }
                    })
                }
            }
        ]
    } else {
        result = (data !== null || data !== undefined) &&
            {
                "type": "template",
                "altText": quizText,
                "template": {
                    "type": "buttons",
                    "text": quizText,
                    "actions": data.choices.map(c => {
                        return {
                            "type": "postback",
                            "label": c.text,
                            "data": `action=quiz&itemid=${quizNo}&value=${c.value}`
                        }
                    })
                }
            }
    }


    return result
}


function getAnswerObj(currentQuestion, selectedValue) {
    let q = question[currentQuestion]
    let obj = {}
    if (q.key.charAt(0) === "q") {
        let selected = _.find(q.choices, c => c.value == selectedValue)
        obj[`${q.key}Question`] = q.question
        obj[`${q.key}AltQuestion`] = q.altQuestion
        obj[`${q.key}Text`] = selected.text
        obj[`${q.key}Value`] = selected.value
    } else {
        obj[q.key] = selectedValue
    }
    return obj
}


function doSubmitQuiz(resultTest, event) {
    var data = _.assign({}, resultTest.data, { isOpenPortfolio: "N", isNextBuy: "Y" })
    let message = {
        type: 'text',
        text: 'รอการประมวลผลสักครู่...'
    };

    client.pushMessage(resultTest.userId, message)
        .then(() => {
            axios.post("http://treasurist.com:8080/quizzes", data, {
                headers: { 'Content-Type': 'application/json;charset=UTF-8' }
            })
                .then(resp => {
                    resultTest = _.remove(resultTest, function (n) { return n.userId !== event.source.userId; });
                    var quiz = resp.data
                    var imgUrl = getDescPhoto(quiz.score)
                    if (imgUrl.original == undefined) {
                        msg = {
                            "type": "text",
                            "text": "ขออภัย! เกิดข้อผิดพลาด"
                        }
                        return client.replyMessage(event.replyToken, msg);
                    } else {
                        suitabilityTestResult(quiz, imgUrl, event)
                    }
                })
                .catch(error => {
                    console.error(error)
                    resultTest = _.remove(resultTest, function (n) { return n.userId !== event.source.userId; });
                    msg = {
                        "type": "text",
                        "text": "ขออภัย! เกิดข้อผิดพลาด"
                    }
                    return client.replyMessage(event.replyToken, msg);
                })
        })
        .catch((err) => {
            msg = {
                "type": "text",
                "text": "ขออภัย! เกิดข้อผิดพลาด"
            }
            return client.replyMessage(event.replyToken, msg);
        });
}

function suitabilityTestResult(quiz, imgUrl, event) {
    let msg =
        [
            {
                "type": "image",
                "originalContentUrl": imgUrl.original,
                "previewImageUrl": imgUrl.original
            },
            {
                "type": "template",
                "altText": "Quiz Complte",
                "template": {
                    "type": "buttons",
                    "title": `รูปแบบการลงทุนที่เหมาะกับคุณ '${getTitle(quiz.score)}'`,
                    "text": "กดเพื่อดูแผนการลงทุนที่เหมาะกับคุณ",
                    "actions": [
                        {
                            "type": "uri",
                            "label": "คลิก!",
                            "uri": `https://www.treasurist.com/chatBotTestResult/${quiz.id}`
                        }
                    ]
                }
            }
        ]
    testResult = []
    return client.replyMessage(event.replyToken, msg);
}


function handleSearchEvent(event, search) {
    var searchPostback = event.postback != undefined ? event.postback.data.split("&") : undefined;
    var searchPostbackAction = searchPostback ? searchPostback[0] != undefined && searchPostback[0].split("=")[1] : "search"
    var searchPostBackItemValue = searchPostback ? searchPostback[2] != undefined ? parseInt(searchPostback[2].split("=")[1]) : undefined : event.message.text.toLowerCase()
    var searchPostBackItem = searchPostback ? (searchPostback[1] != undefined ? parseInt(searchPostback[1].split("=")[1]) + 1 : 0) : search.currentStep + 1;
    if (searchPostbackAction === "search" && searchPostBackItem <= 2) {
        let newResult = getSearchObj((searchPostBackItem - 1), searchPostBackItemValue)
        search.text = newResult != undefined ? `${search.text}&${newResult}` : undefined
        let msg = searchFilterOption(searchFilter[searchPostBackItem], searchPostBackItem)
        search.currentStep = searchPostBackItem
        return client.replyMessage(event.replyToken, msg);

    } else {
        let resultInput = searchPostBackItem != 0 ? getSearchObj((searchPostBackItem - 1), searchPostBackItemValue) : undefined
        search.text = resultInput != undefined ? `${search.text}&${resultInput}` : undefined
        doSubmitSearch(search, event)
    }
}

function getSearchObj(currentStep, selectedValue) {
    let sf = currentStep ? searchFilter[currentStep] : undefined
    let selected = sf && sf.choices ? _.find(sf.choices, c => c.value === selectedValue) : undefined
    let obj = undefined

    if (currentStep === 0) {
        obj = `riskLevel=${selectedValue === "0" ? "1,2,3,4,5,6,7,8" : selectedValue}`
    } else if (currentStep === 1) {
        obj = `taxBenefit=${selected.value === 99 ? "0,1" : selected.value}`
    } else if (currentStep === 2) {
        obj = `location=${selected.value === 99 ? "1,2" : selected.value}`
    } else {
        obj = `keyword=%25${selectedValue}%25`
    }
    return obj
}

function searchFilterOption(data, step) {
    let result
    if (step === 0) {
        result = (data !== null || data !== undefined) && [
            {
                "type": "text",
                "text": `${data.filterTypeText}`
            },
        ]
    } else {
        result = (data !== null || data !== undefined) &&
            {
                "type": "template",
                "altText": `${data.filterTypeText}`,
                "template": {
                    "type": "buttons",
                    "text": `${data.filterTypeText}`,
                    "actions": data.choices.map(c => {
                        return {
                            "type": "postback",
                            "label": c.text,
                            "data": `action=search&itemid=${step}&value=${c.value}`
                        }
                    })
                }
            }
    }

    return result
}

function doSubmitSearch(data, event) {
    let message = {
        type: 'text',
        text: 'กำลังค้นหา...'
    };

    client.pushMessage(data.userId, message)
        .then(() => {
            axios.get(data.text)
            .then(response => {
                searchResult = _.remove(searchResult, function (n) { return n.userId !== event.source.userId; });
                let data = response.data._embedded.funds
                setRecommend(data)
                let fundDataList = data.map( d => { 
                        let isRecommend = _.find(fundRecommendList, fund => fund.fundId === d.fundId)
                            if (isRecommend) {
                                return d
                            }
                        }).filter(d => d)
                let msg = data != undefined ?
                    [
                        {
                            "type": "text",
                            "text": "นี่คือกองทุนแนะนำที่คุณหาอยู่.."
                        },
                        resultList(fundDataList)
                    ] : {
                    "type": "text",
                    "text": "ไม่พบกองทุนที่คุณค้นหา กรุณาลองอีกครั้ง"
                }
                return client.replyMessage(event.replyToken, msg);
            })
            .catch(error => {
                console.error(error);
                searchResult = _.remove(searchResult, function (n) { return n.userId !== event.source.userId; });
                let msg = {
                    "type": "text",
                    "text": "ไม่พบกองทุนที่คุณค้นหา กรุณาลองอีกครั้ง"
                }
                return client.replyMessage(event.replyToken, msg);

            });
        })
        .catch((err) => {
            msg = {
                "type": "text",
                "text": "ไม่พบกองทุนที่คุณค้นหา กรุณาลองอีกครั้ง"
            }
            return client.replyMessage(event.replyToken, msg);
        });
}
 
function setRecommend(data) {
    let topThreeList = _.map(data, (d, i) => {
        if (i <= 2) {
          return {fundId: d.fundId, phillipAvailable: d.phillipAvailable}
        }
      }).filter( l => l)
  
      let count = 0
      _.map(topThreeList, l => {
        if (l.phillipAvailable == "Y") {
          count = count + 1
        }
      })
      let isTopThree = false
       if (count > 0) {
          isTopThree = true
        } else {
          isTopThree =  false
        }
  
      let fundRecommend = []
      if (!isTopThree) {
        fundRecommend = _.map(data, (d, i) => {
          if (i > 2 && d.phillipAvailable == "Y") {
            return {fundId: d.fundId, phillipAvailable: d.phillipAvailable}
          }
        }).filter(fr => fr)
      }
    fundRecommendList = _.concat(topThreeList, _.dropRight(fundRecommend, fundRecommend.length - 1))
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});