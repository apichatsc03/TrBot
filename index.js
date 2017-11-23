const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

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

export const getData = (keyword) => {
    let requestedUrl = `http://treasurist.com/api/funds/search/main?page=0&size=9&sort=fundResult.sweightTotal,DESC&projection=fundList&riskLevel=1,2,3,4,5,6,7,8&taxBenefit=0,1&location=1,2&keyword=%25${keyword}%25`
    let promise = axios.get(requestedUrl)   
    return  getProgressiblePromise(promise)
  }

const getProgressiblePromise = async (promise) => {
    try {
      let resp = await promise
      return resp
    } catch (err) {
      throw err
    }
}

function handleMessageEvent(event) {
    var msg = {
        type: 'text',
        text: 'สวัสดีครับยินดีต้อนรับ'
    };

    var eventText = event.message.text.toLowerCase()
    

    if (eventText === "about you") {
        msg = {
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
    } else {
        var keyword = eventText.split("search").join("")
        
        var data = getData(keyword);
        // var textValue = `${data.fundNameTh} ( ${data.fundCode} ) https://wwww.treasurist.com/${data.fundId}/${data.fundNameEn}`
        console.log("name > ", data)
        msg = {
            type: 'text',
            text: data.fundNameTh
        };
    }

    return client.replyMessage(event.replyToken, msg);
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});