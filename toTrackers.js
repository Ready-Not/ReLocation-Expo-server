const {firestore} = require('./config');
var Distance = require('geo-distance');

//send push notification to tokens
//set timer to run function every xx min
sendPushToTrackers = function () {
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
      "body": token.message
    },
    json: true,
    function(error, response, body){
      // resp.send(body)
    }
  })
  console.log(`"Track notifications" sent to : ${token.pushToken}`)
})
console.log(`Next batch will be sent in ${timeout/1000} sec`)
})
setTimeout(sendPushToTrackers, timeout);
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
      if (token) {
      pushTokensArr.push({
        pushToken: token,
        message: uidArr[i].message
      })
    }}
    console.log('got all late tokens: ', pushTokensArr)
    return pushTokensArr
  } catch (e) {
    console.error(e)
  }
}


//1. Get all tracks we need to send notifications about
const getLateUsers = async () => {
  try {
    let usersToNotify = []
    //get all tracks with status "open"
    let tracks = await firestore
    .collection('tracks')
    .where('status', '==', 'open')
    .get()
    tracks.forEach(async track => {
      //check if current time more then ETA
      let trackData = track.data()
      let time = trackData.ETA
      let howLate = Date.now()/1000 - time.seconds
      let trackers = track.data().tracker
      // add tracker's uid and late time for all open tracks to the array
      if (howLate > 0 && !trackData.lateTrackNotification) {
        if (trackers) {

        //calculate, how far trackee from their final destination
        let howFar = 0
        if (trackData.finalLocation) {
        let current = {
          lat: trackData.currentLocation.latitude,
          lon: trackData.currentLocation.longitude
        }
        let final = {
          lat: trackData.finalLocation.latitude,
          lon: trackData.finalLocation.longitude
        }
        howFar = Distance.between(current, final).human_readable().distance
        }

        if (howFar > 0.2) {
        trackers.forEach(tracker => {
          usersToNotify.push({
            uid: tracker,
            message: `Your trackee about ${howFar} km away from you final destination.`
          })
        })
        usersToNotify.push({
          uid: trackData.trackee.id,
            message: `You are about ${howFar} km away from you final destination.`
        })
        await firestore
          .collection('tracks')
          .doc(track.id)
          .update({
            lateTrackNotification: 'sent'
          })
      } else {
        trackers.forEach(async tracker => {
          usersToNotify.push({
            uid: tracker,
            message: `Your trackee is safe to they destination.`
          })
        })
        usersToNotify.push({
          uid: trackData.trackee,
            message: `You are safe at your destination. You trip is completed`
        })
        await firestore
          .collection('tracks')
          .doc(track.id)
          .update({
            status: 'closed'
          })
      }


      }}
    })
    console.log('got all users to notify about open tracks: ', usersToNotify)
    return usersToNotify;
  } catch (e) {
    console.error(e)
  }
}

//for testing
// sendPushToTrackers()
// getUserPushTokens()
// getLateUsers()

exports.sendPushToTrackers = sendPushToTrackers
