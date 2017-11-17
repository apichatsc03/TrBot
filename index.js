const express = require('express');
const line = require('@line/bot-sdk');

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
    var msg = {
        type: 'text',
        text: 'สวัสดีครับยินดีต้อนรับ'
    };

    return client.replyMessage(event.replyToken, msg);
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});