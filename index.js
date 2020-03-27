const {firestore} = require('./config');

//send push notification to tokens
//set timer to run function every xx min
sendPush = function () {
  const req = require('request');
  const timeout = 50000;
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
      "to": token.pushToken,
      "sound": "default",
      "body": `Hey! Your friend late to her/his destination for ${token.howLate}.`
    },
    json: true,
    function(error, response, body){
      // resp.send(body)
    }
  })
  console.log(`"Late notification" sent to traker: ${token.pushToken} - late for ${token.howLate}`)
})
console.log(`Next batch will be sent in ${timeout/1000} sec`)
})
setTimeout(sendPush, timeout);
}



//2. get trackers' push notifications tokens
const getUserPushTokens = async () => {
  try {
    let uidArr = await getLateUsers();
    let pushTokensArr = []
    for (let i = 0; i< uidArr.length; i++) {
      let user = await firestore
      .collection('users')
      .doc(uidArr[i].uid)
      .get()
      let token = user.data().pushToken
      pushTokensArr.push({
        pushToken: token,
        howLate: uidArr[i].howLate
      })
    }
    console.log('got all late tokens: ', pushTokensArr)
    return pushTokensArr
  } catch (e) {
    console.error(e)
  }
}


//1. Get all tracks we need to send notifications about
const getLateUsers = async () => {
  try {
    let homeLate = []
    //get all tracks with status "open"
    let tracks = await firestore
    .collection('tracks')
    .where('status', '==', 'open')
    .get()
    tracks.forEach(track => {
      //check if current time more then ETA
      let time = track.data().time
      let howLate = Date.now() - time.seconds*1000
      //add tracker's uid and late time for all open tracks to the array
      if (howLate > 0) {
        let trackers = track.data().tracker
        trackers.forEach(tracker => {
          homeLate.push({
            uid: tracker,
            howLate: `about ${Math.floor((howLate/1000/60) << 0)} min`
          })
        })
      }
    })
    console.log('got all trackers for all late open tracks: ', homeLate)
    return homeLate;
  } catch (e) {
    console.error(e)
  }
}

sendPush()

// getUserPushTokens()

// getLateUsers()
