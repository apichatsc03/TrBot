// import * as axios from 'axios'
// import _ from 'lodash'
const express = require('express');
const line = require('@line/bot-sdk');

require('dotenv').config();

const app = express();

const config = {
    channelAccessToken: "RMq4Bp7+2QyaShjLsD0Zacd3Euu0iI0WSySwhPBb9Eu8uNfnEeFgwJT1yKIu6k76OABgI5iQWIrlCst3I9jvPBqsEnoFv36LCgE3yjG1qidfcRJI6EKp8zX2tJOb3kXZ1OMIUml1nklYb65spkBgAgdB04t89/1O/w1cDnyilFU=",
    channelSecret: "f254790716db06725a815f0e4baa6e74"
};

const client = new line.Client(config);

// const listRecommend = () => {
//     let data = {}
//     this.search('funds', 'homeList', {}, {
//       page: 0,
//       size: 6,
//       sort: "fundResult.sweightTotal,DESC"
//     }, 'fundList').then(resp => {
//       data = resp.data._embedded
//     }).catch(err => {
//       console.error(err)
//     })

//   return data
// }


// axios.defaults.baseURL = 'https://treasurist.com/api';
// axios.defaults.headers.common['TR-Device-Type'] = 'Web'
// axios.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     return config;
//   }, function (error) {
//     // Do something with request error
//     return Promise.reject(error);
//   });

// // Add a response interceptor
// axios.interceptors.response.use(function (response) {
//     // Do something with response data
//     return response;

//   }, function (error) {
//     // Do something with response error
//     console.log("axios interceptor error: ", error.status)
//     if(error.status === 404){
//       return Promise.reject('404 Not found')
//     }
//     return Promise.reject(error);
//   });

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

    var eventText = event.message.text.toLowerCase();

    if (eventText === "about you") {
        let data = listRecommend()
        msg = {
            "type": "template",
            "altText": "Welcome to Treasurist",
            "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://www.treasurist.com/assets/images/logo-large.png",
                "title": "Menu",
                "text": "Please select",
                "actions": [
                    {
                      "type": "uri",
                      "label": "",
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
    } else if (eventText === "top") {
        // let data = listRecommend()
        var msg = {
            type: 'text',
            text: 'Work in process....'
        };
    }

    return client.replyMessage(event.replyToken, msg);
}

// function search(resource, method, query, pageable, projection){
//     let params = _.assign({}, pageable, {projection}, query)
//     return axios.get(resource+'/search/'+method, {auth, params})
// }

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});