const  request  = require('http');

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const moment = require('moment');
const question = require('./src/testResult/Questionair');
const crypto = require('crypto');
const _ = require('lodash');

require('dotenv').config();

const app = express();

const config = {
    channelAccessToken: "DUPTQDbc7OJ4TWhAoH0g3CQrFzUrM3V5/Rct8+/WrYzFlRa+52O4WJhKZfLcf5UfTFVbvlUFGoYwvi9DuZX+Y7lEZxg6ooJizTKfZ24q7RaDT3SOqmiGNSdXcPAsupgW4clP2b6qTzofsGDlRH7/hAdB04t89/1O/w1cDnyilFU=",
    channelSecret: "27374a9d6aadc76cee07b49aa8955ec3"
};

const client = new line.Client(config);
let testResult;
let currentQuestion;

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

    console.log(event);
    if (event.type === 'message' && event.message.type === 'text') {
        var isTesting = _.find(testResult, ['userId', event.source.userId]);
        if (!isTesting) {
            handleMessageEvent(event);
        } else {
            testResult.filter( tr => tr.userId = event.source.userId)
                .map( tr => {
                    console.log("tr >>", tr)
                    return handlePostBackEvent(event, tr);
                })
        }
       
    } else if (event.type === 'postback') {
        testResult
        .filter( tr => tr.userId = event.source.userId)
        .map( tr => {
            console.log("tr >>", tr)
            return handlePostBackEvent(event, tr);
        }) 
    } else {
        return Promise.resolve(null);
    }
}

function handleMessageEvent(event) {
    var eventText = event.message.text.toLowerCase()
    var eventType = event.source.type

    var re = /(\bsearch\b)/;
    if (eventText === "about you") {
        console.log(eventText);
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
        console.log(eventText);

        let msg = {
            "type": "template",
            "altText": "Welcome to Treasurist",
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                "title": "Welcome to Treasurist Test",
                "text": "เริ่มวงแผนการลงทุนที่เหมาะกับคุณ",
                "actions": [
                    {
                        "type": "postback",
                        "label": "Start",
                        "data": "action=test"
                    }
                ]
            }
        }
        testResult = _.concat([], [{"userId": event.source.userId}])
        console.log("testResult >>", testResult)
        return client.replyMessage(event.replyToken, msg);
    } else if (re.test(eventText)) {
        var keyword = eventText.split("search ")[1]
        console.log(`${re.test(eventText)} :: ${keyword}`);
        axios.get(`http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&riskLevel=1,2,3,4,5,6,7,8&taxBenefit=0,1&location=1,2&keyword=%25${keyword}%25`)
            .then(response => {
                let data = response.data._embedded.funds
                console.log("Data size > ", data != undefined && data.length)
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

function handlePostBackEvent(event, suitTest) {
    
    var eventPostback = event.postback != undefined ? event.postback.data.split("&") : undefined; 
    var eventPostbackAction = eventPostback ? eventPostback[0] != undefined && eventPostback[0].split("=")[1] : "test"
    var eventPostBackItem = eventPostback ? eventPostback[1] != undefined ? parseInt(eventPostback[1].split("=")[1]) : 0 : currentQuestion + 1;
    var eventPostBackItemValue = eventPostback ? eventPostback[2] != undefined ? parseInt(eventPostback[2].split("=")[1]) : undefined : event.message.text.toLowerCase()

    if (eventPostbackAction === "test" && eventPostBackItem < 16) {
        let result = eventPostBackItem != 0 ? getAnswerObj((eventPostBackItem - 1), eventPostBackItemValue) : undefined
        suitTest = result != undefined ? _.merge(suitTest, result) : undefined
        console.log("resultTest >>", suitTest)
        console.log(eventPostBackItem);
        let msg
        if (question[eventPostBackItem].choices != undefined) {
            console.log(question[eventPostBackItem].choices);
            msg = {
                "type": "template",
                "altText": question[eventPostBackItem].altQuestion,
                "template": {
                    "type": "buttons",
                    "text": question[eventPostBackItem].question,
                    "actions": question[eventPostBackItem].choices.map(c => {
                        return {
                            "type": "postback",
                            "label": c.text,
                            "data": `action=test&itemid=${eventPostBackItem + 1}&value=${c.value}`
                        }
                    })
                }
            }
        } else {
            msg = {
                "type": "text",
                "text": question[eventPostBackItem].question
            }
        }
        currentQuestion = eventPostBackItem
        return client.replyMessage(event.replyToken, msg);
    } else if (eventPostbackAction === "test" && eventPostBackItem === 16) {
        let resultInput = eventPostBackItem != 0 ? getAnswerObj(eventPostBackItem, eventPostBackItemValue) : undefined
        suitTest = resultInput != undefined ? _.merge(suitTest, resultInput) : undefined
        var linkURL = doSubmitQuiz(suitTest)
        console.log("linkURL >>", linkURL)
        let msg = {
            "type": "template",
            "altText": "Test Complte",
            "template": {
                "type": "buttons",
                "title": "Test Complte",
                "text": "See Result Test Click 'View'",
                "actions": [
                    {
                        "type": "uri",
                        "label": "View",
                        "uri": "https://www.treasurist.com/suitabilityTest"
                    }
                ]
            }
        }
        return client.replyMessage(event.replyToken, msg);
    }
}

function getAnswerObj(currentQuestion, selectedValue) {
    console.log
    let q = question[currentQuestion]
    let obj = {}
    if (q.key.charAt(0) === "q") {
      let selected = _.find(q.choices, c => c.value == selectedValue)
      obj[`${q.key}Question`] = q.question
      obj[`${q.key}AltQuestion`] = q.altQuestion
      obj[`${q.key}Text`] = selected.text
      obj[`${q.key}Value`] = selected.value+""
    } else {
      obj[q.key] = selectedValue
    }
    return obj
}


const doSubmitQuiz = (resultTest) => {
    var data = resultTest
    delete data.userId
    console.log("data >> ", data)
    axios.post("http://treasurist.com/api/quizzes", data)
        .then(resp => {
            console.log("quizId" ,resp.data.id)
            // return `https://www.treasurist.com/testResult/${resp.data.id}`
        })
        .catch(error => {
            console.error(error)
        })
    
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});