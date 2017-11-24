const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const moment = require('moment');
const question = require('./src/testResulte/Questionair');
const crypto = require('crypto');

require('dotenv').config();

const app = express();

const config = {
    channelAccessToken: "DUPTQDbc7OJ4TWhAoH0g3CQrFzUrM3V5/Rct8+/WrYzFlRa+52O4WJhKZfLcf5UfTFVbvlUFGoYwvi9DuZX+Y7lEZxg6ooJizTKfZ24q7RaDT3SOqmiGNSdXcPAsupgW4clP2b6qTzofsGDlRH7/hAdB04t89/1O/w1cDnyilFU=",
    channelSecret: "27374a9d6aadc76cee07b49aa8955ec3"
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
    // if (!validate_signature(req.headers['x-line-signature'], req.body)) {
    //     return;
    // } else {

        Promise.all(req.body.events.map(handleEvent))
            .then((result) => res.json(result));
    // }
});

function validate_signature(signature, body) {
    return signature == crypto.createHmac('sha256', config.channelSecret).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
}

function handleEvent(event) {

    console.log(event);
    if (event.type === 'message' && event.message.type === 'text') {
        handleMessageEvent(event);
    } else if (event.type === 'postback') {
        handlePostBackEvent(event);
    } else {
        return Promise.resolve(null);
    }
}

function handleMessageEvent(event) {
    var eventText = event.message.text.toLowerCase()
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
    } else if (eventText === "test") {
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
        return client.replyMessage(event.replyToken, msg);
    } else if (re.test(eventText)) {
        console.log(`${re.test(eventText)} :: ${eventText}`);
        var keyword = eventText.split("search")[1]

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

function handlePostBackEvent(event) {
    var eventPostback = event.postback.data.split("&")
    var eventPostbackAction = eventPostback[0] != undefined && eventPostback[0].split("=")[1]
    var eventPostBackItem = eventPostback[1] != undefined ? parseInt(eventPostback[1].split("=")[1]) : 0
    console.log(question[eventPostBackItem].choices);
    if (eventPostbackAction === "test" && eventPostBackItem <= 16) {
        console.log(eventPostBackItem);
        let msg = {
            "type": "template",
            "altText": question[eventPostBackItem].altQuestion,
            "template": {
                "type": "buttons",
                "text": question[eventPostBackItem].question,
                "actions": question[eventPostBackItem].choices.map(c => {
                            return {
                                "type": "postback",
                                "label": c.text,
                                "data": `action=test&itemid=${eventPostBackItem+1}&value=${c.value}`
                            }
                        })
            }
        }
        return client.replyMessage(event.replyToken, msg);
    } 
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});