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
    let imageSuittest = { original: undefined, preview: undefined}
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

let testResult;
let currentQuestion;
let searchResult;
let currentStep;

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
    console.log("event", event)
    if (event.type === 'message' && event.message.type === 'text') {
        var isTesting = _.find(testResult, ['userId', event.source.userId]);
        var isSearch = searchResult !== undefined ? true : false;
        if (isTesting) {
            testResult.filter(tr => tr.userId = event.source.userId)
                .map(tr => {
                    return handlePostBackEvent(event, tr);
                })
        } else if (isSearch) {
            console.log("search")
            if (currentStep != undefined) {
                console.log("currentStep", currentStep)
                handleSearchEvent(event);
            } else {
                let newResult = getSearchObj(undefined, event.message.text.toLowerCase())
                searchResult = newResult != undefined ? `${searchResult}&${newResult}` : undefined
                currentStep = 0
                let msg =  searchFilterOption(searchFilter[currentStep], currentStep)
                return client.replyMessage(event.replyToken, msg);
            }
        } else {
            handleMessageEvent(event);
        }
    } else if (event.type === 'postback') {
        testResult
            .filter(tr => tr.userId = event.source.userId)
            .map(tr => {
                return handlePostBackEvent(event, tr);
            })
    } else {
        return Promise.resolve(null);
    }
}

function handleMessageEvent(event) {
    var eventText = event.message.text.toLowerCase()
    var eventType = event.source.type
    if (eventText === "about you") {
        let msg = {
            "type": "template",
            "altText": "Welcome to Treasurist",
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                "title": "Welcome to Treasurist Menu",
                "text": "Please select",
                "actions": [
                    {
                        "type": "uri",
                        "label": "Test",
                        "uri": "https://www.treasurist.com/suitabilityTest"
                    },
                    {
                        "type": "uri",
                        "label": "Search",
                        "uri": "https://www.treasurist.com/search?riskLevel=&taxBenefit=-1&location=-1&keyword=&sort=fundResult.sweightTotal,DESC"
                    },
                    {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "https://www.treasurist.com/howItWork"
                    }
                ]

            }
        }
        return client.replyMessage(event.replyToken, msg);
    } else if (eventText === "test" && eventType === "user") {
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
                        "data": "action=test"
                    }
                ]
            }
        }
        testResult = _.concat([], [{ "userId": event.source.userId }])
        return client.replyMessage(event.replyToken, msg);
    } else if (eventText === "search") {
        let msg = {
            "type": "text",
            "text": "คุณอยากค้นหากองทุนแบบไหน ให้พิมพ์สิ่งที่อยากค้นหาต่อได้เลยค่ะ"
        }
        searchResult = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&`
        return client.replyMessage(event.replyToken, msg);
    } else if (eventText === "help"){
        let msg = {
            "type": "text",
            "text": `อยากรู้เรื่อง Treasurist ให้พิมพ์ว่า 'About you'\n\nอยากเริ่มลงทุนให้พิมพ์คำว่า 'Test'\n\nอยากค้นหาข้อมูลการลงทุนให้พิมพ์ว่า 'search' ตามด้วยคำค้นหา เช่น 'search SCB' ค่ะ`
        }
        return client.replyMessage(event.replyToken, msg);
    } else {
        let msg = {
            "type": "text",
            "text": `สวัสดีค่ะ ที่พิมพ์มาก็น่าสนใจนะคะ แต่เรายังตอบไม่ได้ ถ้าอยากจะได้แผนลงทุนใน 3 นาที ให้พิมพ์ 'Test' หรือถ้าต้องการความช่วยเหลือให้พิมพ์ว่า 'Help' ค่ะ`
        }
        return client.replyMessage(event.replyToken, msg);
    }
}

function resultList(data) {
    let resultList = (data !== null || data !== undefined) && {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": data.map(s => {
                return {
                    "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                    "title": `${s.fundCode} :: ${s.lastestNavDateList[0].nav ? s.lastestNavDateList[0].nav : '0.0000'} (Baht/Unit)`,
                    "text": `${s.fundNameTh}`,
                    "actions": [
                        {
                            "type": "uri",
                            "label": "View detail",
                            "uri": `http://www.treasurist.com/funds/${s.fundId}/${s.fundNameEn.split(/[\s/@+.()%]/).join('-').toLowerCase()}`
                        }
                    ]
                }
            })
        }
    }

    return resultList
}

function numberOnly(value) {
    if (value) {
        let numVal = parseInt((value + "").replace(/[^0-9]/g, ''))
        if(numVal > 0){
            return false
        }else{
            return true
        }
    } else {
        return true
    }
    
}


function handlePostBackEvent(event, suitTest) {
    var eventPostback = event.postback != undefined ? event.postback.data.split("&") : undefined;
    var eventPostbackAction = eventPostback ? eventPostback[0] != undefined && eventPostback[0].split("=")[1] : "test"
    var eventPostBackItemValue = eventPostback ? eventPostback[2] != undefined ? parseInt(eventPostback[2].split("=")[1]) : undefined : event.message.text.toLowerCase()
    let isValid = false
    if (currentQuestion === 4 ||  currentQuestion === 5) {
        isValid = numberOnly(eventPostBackItemValue)
    }
   
    var eventPostBackItem = eventPostback ? eventPostback[1] != undefined ? parseInt(eventPostback[1].split("=")[1]) : 0 : !isValid ? currentQuestion + 1 : currentQuestion;
   
    if (eventPostbackAction === "test" && eventPostBackItem < 16) {
        
        var quizNo = eventPostBackItem + 1
        let result = eventPostBackItem != 0 && !isValid ? getAnswerObj((eventPostBackItem - 1), eventPostBackItemValue) : undefined
        suitTest = result != undefined ? _.merge(suitTest, result) : undefined
        currentQuestion = !isValid ? eventPostBackItem : currentQuestion
        if (question[eventPostBackItem].choices != undefined && !isValid) {
            let msg =  quizResult(question[eventPostBackItem], quizNo)
            currentQuestion = !isValid ? eventPostBackItem : currentQuestion
            return client.replyMessage(event.replyToken, msg);
        } else {
            let msg = {
                "type": "text",
                "text": `${!isValid ? `${quizNo}. ${question[eventPostBackItem].question}` : "กรุณากรอกจำนวนเงินเป็นตัวเลข"}`
            }
            currentQuestion = !isValid ? eventPostBackItem : currentQuestion
            return client.replyMessage(event.replyToken, msg);
        }
      
    } else if (eventPostbackAction === "test" && eventPostBackItem === 16) {
        let resultInput = eventPostBackItem != 0 ? getAnswerObj(eventPostBackItem - 1, eventPostBackItemValue) : undefined
        suitTest = resultInput != undefined ? _.merge(suitTest, resultInput) : undefined
        doSubmitQuiz(suitTest, event)
    }
}

function quizResult(data, quizNo) {
    let quizText = `${quizNo}. ${data.question}`
    let result

    if (quizNo === 11 || quizNo === 12) {
        result =  (data !== null || data !== undefined) && [
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
                            "data": `action=test&itemid=${quizNo}&value=${c.value}`
                        }
                    })
                }
            }
        ]
    } else {
        result =   (data !== null || data !== undefined) &&
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
                        "data": `action=test&itemid=${quizNo}&value=${c.value}`
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
    var data = _.assign({} ,resultTest, {isOpenPortfolio: "N", isNextBuy: "Y"})
    delete data.userId
    axios.post("http://treasurist.com:8080/quizzes", data, {
        headers: {'Content-Type': 'application/json;charset=UTF-8'}
    })
        .then(resp => {

            var quiz = resp.data
            var imgUrl = getDescPhoto(quiz.score)
            if (imgUrl.original == undefined) {
                msg = {
                    "type": "text",
                    "text": "ขออภัย! เกิดข้อผิดพลาด"
                }
                return client.replyMessage(event.replyToken, msg);
            } else {
                suitabilityTestResult(quiz, imgUrl,event)
            }        
           
        })
        .catch(error => {
            console.error(error)
        })
}

function suitabilityTestResult(quiz, imgUrl, event) {
    let msg = 
    [
        {
            "type": "image",
            "originalContentUrl": imgUrl.original,
            "previewImageUrl":  imgUrl.original
        },
        {
            "type": "template",
            "altText": "Test Complte",
            "template": {
                "type": "buttons",
                "title": `รูปแบบการลงทุนที่เหมาะกับคุณ '${getTitle(quiz.score)}'`,
                "text":  "กดเพื่อดูแผนการลงทุนที่เหมาะกับคุณ",
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


function handleSearchEvent(event) {
    var searchPostback = event.postback != undefined ? event.postback.data.split("&") : undefined;
    var searchPostbackAction = searchPostback ? searchPostback[0] != undefined && searchPostback[0].split("=")[1] : "search"
    var searchPostBackItemValue = searchPostback ? searchPostback[2] != undefined ? parseInt(searchPostback[2].split("=")[1]) : undefined : event.message.text.toLowerCase()
    var searchPostBackItem = searchPostback ? (searchPostback[1] != undefined ? parseInt(searchPostback[1].split("=")[1]) : 0 ): currentStep + 1 ;
   
    if (searchPostbackAction === "search" && searchPostBackItem < 2) {
        console.log("here")
        let newResult = getSearchObj((searchPostBackItem - 1), searchPostBackItemValue)
        searchResult = newResult != undefined ? `${searchResult}&${newResult}` : undefined
        let msg =  searchFilterOption(searchFilter[searchPostBackItem], searchPostBackItem)
        currentStep =  searchPostBackItem
        return client.replyMessage(event.replyToken, msg);
        
    } else if (searchPostbackAction === "search" && searchPostBackItem === 2) {
        let resultInput = searchPostBackItem != 0 ? getSearchObj((searchPostBackItem - 1), searchPostBackItemValue) : undefined
        searchResult = resultInput != undefined ? `${searchResult}&${result}` : undefined
        doSubmitSearch(searchResult, event)
    }
}

function getSearchObj(currentStep, selectedValue) {
    let sf = currentStep ? searchFilter[currentStep] : undefined
    let selected = sf && sf.choices ? _.find(sf.choices, c => c.value == selectedValue) : undefined
    let obj = undefined

    if (currentStep === 0) {
        obj = `riskLevel=${selectedValue}`
    } else if (currentStep === 1) {
        obj = `taxBenefit=${selected.value}`
    } else if (currentStep === 2) {
        obj = `location=${selected.value}`
    } else {
        obj = `keyword=%25${selectedValue}%25`
    }
    console.log("Obj", obj)
    return obj
}

function searchFilterOption(data, step) {
    let result
    if (step === 0) {
        result =  (data !== null || data !== undefined) && [
            {
                "type": "text",
                "text": `${data.filterTypeText}`
            },
        ]
    } else {
        result =  (data !== null || data !== undefined) &&
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
                        "data": `action=test&itemid=${step}&value=${c.value}`
                    }
                })
            }
        }
    }
    return result
}

function doSubmitSearch(data, event) {
    axios.get(data)
        .then(response => {
            let data = response.data._embedded.funds
            let msg = data != undefined ? resultList(data) : {
                "type": "text",
                "text": "Search Not Found!, Please Try Again."
            }
            return client.replyMessage(event.replyToken, msg);
        })
        .catch(error => {
            console.log(error);
        });
}


app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});