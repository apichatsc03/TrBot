const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const moment = require('moment');

require('dotenv').config();

const app = express();

const config = {
    channelAccessToken: "RMq4Bp7+2QyaShjLsD0Zacd3Euu0iI0WSySwhPBb9Eu8uNfnEeFgwJT1yKIu6k76OABgI5iQWIrlCst3I9jvPBqsEnoFv36LCgE3yjG1qidfcRJI6EKp8zX2tJOb3kXZ1OMIUml1nklYb65spkBgAgdB04t89/1O/w1cDnyilFU=",
    channelSecret: "f254790716db06725a815f0e4baa6e74"
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
});

function handleEvent(event) {

    console.log(event);
    if (event.type === 'message' && event.message.type === 'text') {
        handleMessageEvent(event);
    } else {
        return Promise.resolve(null);
    }
}

function handleMessageEvent(event) {

    var eventText = event.message.text.toLowerCase()
    

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
    } else {
        var keyword = eventText.split("search").join("")
        
        axios.get(`http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&riskLevel=1,2,3,4,5,6,7,8&taxBenefit=0,1&location=1,2&keyword=%25${keyword}%25`)
          .then(response => {
            let data = response.data._embedded.funds
            console.log("Data size > ", data != undefined && data.length)
            let msg =  data != undefined ? resultList(data) : {
                "type": "text",
                "text": "Search Not Found!!"
            }
            return client.replyMessage(event.replyToken, msg);
          })
          .catch(error => {
            console.log(error);
          });
        console.log("Here !!!")
        // var textValue = `${data.fundNameTh} ( ${data.fundCode} ) https://wwww.treasurist.com/${data.fundId}/${data.fundNameEn}`
    }

    // return client.replyMessage(event.replyToken, msg);
}

function resultList(data) {
    let resultList = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": data.map( s => {
                return {
                    "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                    "title": `${s.fundCode} :: ${s.fundNameTh}`, 
                    "text": `${s.lastestNavDateList[0].nav ? s.lastestNavDateList[0].nav : '0.0000'} (Baht/Unit) ราคาล่าสุด ณ ${s.lastestNavDateList[0].navDate}`,
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

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});