const {firestore} = require('./config');

//send push notification to tokens
//set timer to run function every xx min
sendPushToConfirmTrack = function () {
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
      "body": `Hey! You have a track to confirm.`
    },
    json: true,
    function(error, response, body){
      // resp.send(body)
    }
  })
  console.log(`"Confirm track notification" sent to traker: ${token.pushToken}`)
})
console.log(`Next batch will be sent in ${timeout/1000} sec`)
})
setTimeout(sendPushToConfirmTrack, timeout);
}



//2. get trackers' push notifications tokens
const getUserPushTokens = async () => {
  try {
    let uidArr = await getPendingTracks();
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
      })
    }}
    console.log('got all confirm track tokens: ', pushTokensArr)
    return pushTokensArr
  } catch (e) {
    console.error(e)
  }
}


//1. Get all tracks we need to send notifications about
const getPendingTracks = async () => {
  try {
    let pendingTracks = []
    let tracks = await firestore
    .collection('tracks')
    .where('status', '==', 'open')
    .where('confirm', '==', 'pending')
    .get()
    tracks.forEach(async track => {
      let trackData = track.data()
      if (!trackData.confTrackNotification) {
      // add trackee to the array
          pendingTracks.push({
            uid: trackData.trackee,
          })
          await firestore
            .collection('tracks')
            .doc(track.id)
            .update({
              confTrackNotification: 'sent'
            })
        }
      })
    console.log('got all pending tracks: ', pendingTracks)
    return pendingTracks;
  } catch (e) {
    console.error(e)
  }
}

//for testing
// sendPushToConfirmTrack()
// getUserPushTokens()
// getPendingTracks()

exports.sendPushToConfirmTrack = sendPushToConfirmTrack
