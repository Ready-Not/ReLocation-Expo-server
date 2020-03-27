const {firestore} = require('./config');

//send push notification to tokens
//set timer (run function) every xx mins

sendPush = function () {
  const req = require('request');
  getUserPushTokens()
  .then (tokens => {
  tokens.map(token => {
  req.post({
    headers: {
      'host': 'exp.host',
      'accept': 'application/json',
      'accept-encoding': 'gzip, deflate',
      'content-type': 'application/json',
    },
    url: 'https://exp.host/--/api/v2/push/send',
    body: {
      "to": token,
      "sound": "default",
      "body": "Hello from Me"
    },
    json: true,
    function(error, response, body){
      console.log(body);
      // resp.send(body)
    }
  })
  console.log('Push sent')
})
})
  setTimeout(sendPush, 50000);
}



//get tracker's push tokens
const getUserPushTokens = async () => {
  try {
    let uidArr = await getLateUsers();
    console.log('got uids array: ', uidArr)
    let pushTokensArr = []
    for (let i = 0; i< uidArr.length; i++) {
      let user = await firestore
      .collection('users')
      .doc(uidArr[i])
      .get()
      let token = user.data().pushToken
      pushTokensArr.push(token)
      console.log('getting token...', token)
    }
    console.log('all tokens: ', pushTokensArr)
    return pushTokensArr
  } catch (e) {
    console.error(e)
  }
}


//get array of tokens where to send late notifications
const getLateUsers = async () => {
  try {
    let homeLate = []
    let tracks = await firestore
    .collection('tracks')
    .where('status', '==', 'open')
    .get()
    tracks.forEach(track => {
      let time = track.data().time
      if (time.seconds*1000 < Date.now()) {
        let trackers = track.data().tracker
        trackers.forEach(tracker => {
          homeLate.push(tracker)
          console.log('adding new traker')
        })
      }
    })
    console.log('all late: ', homeLate)
    return homeLate;
  } catch (e) {
    console.error(e)
  }
}

sendPush()
